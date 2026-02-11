import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../../middleware/authMiddleware.js';
import User from '../../models/User.js';
import Translation from '../../models/Translation.js';
import Compilation from '../../models/Compilation.js';

const router = express.Router();

console.log('📊 [DASHBOARD] Loading dashboard routes...');

// GET /api/dashboard - Show user's personal dashboard
router.get('/', protect, async (req, res) => {
    try {
        const { period = 'day' } = req.query;
        
        console.log('📊 [DASHBOARD] Request received from user:', req.user?.email);
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to access your dashboard'
            });
        }

        const userId = req.user._id;
        
        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();
        
        switch(period) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 1);
        }

        // 1. Get user's translations for the selected period
        const userTranslations = await Translation.find({
            userId: userId,
            createdAt: { $gte: startDate }
        }).sort({ createdAt: -1 });

        console.log(`📊 Found ${userTranslations.length} translations for user ${req.user.email}`);

        // 2. Get user's compilations for the selected period
        const userCompilations = await Compilation.find({
            userId: userId,
            createdAt: { $gte: startDate }
        }).countDocuments();

        console.log(`🔨 Found ${userCompilations} compilations for user ${req.user.email}`);

        // 3. Calculate language usage
        const languageStats = {};
        let totalLanguageUses = 0;
        
        userTranslations.forEach(translation => {
            const fromLang = translation.sourceLanguage;
            const toLang = translation.targetLanguage;
            
            if (fromLang) {
                languageStats[fromLang] = (languageStats[fromLang] || 0) + 1;
                totalLanguageUses++;
            }
            if (toLang) {
                languageStats[toLang] = (languageStats[toLang] || 0) + 1;
                totalLanguageUses++;
            }
        });

        const totalTranslations = userTranslations.length;
        const languageUsage = Object.entries(languageStats)
            .map(([language, count]) => ({
                language,
                count,
                percentage: totalLanguageUses > 0 ? Math.round((count / totalLanguageUses) * 100) : 0,
                color: getColorForLanguage(language)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6); // Limit to top 6 languages

        // 4. Calculate Feature Support Rate
        const supportedTranslations = userTranslations.filter(t => 
            t.status === 'success'
        ).length;

        const featureSupportRate = totalTranslations > 0 ? 
            parseFloat(((supportedTranslations / totalTranslations) * 100).toFixed(1)) : 0;

        // 5. Calculate Failure Reasons
        const failedTranslations = userTranslations.filter(t => 
            t.status !== 'success'
        );

        const failureReasons = {
            unsupported: failedTranslations.filter(f => f.status === 'failed_unsupported').length,
            compilation: failedTranslations.filter(f => f.status === 'failed' || f.error?.includes('compilation')).length,
            other: failedTranslations.filter(f => !['failed_unsupported', 'failed'].includes(f.status)).length
        };

        // Calculate percentages
        const failureReasonPercentages = {
            unsupported: failedTranslations.length > 0 ? 
                parseFloat(((failureReasons.unsupported / failedTranslations.length) * 100).toFixed(1)) : 0,
            compilation: failedTranslations.length > 0 ? 
                parseFloat(((failureReasons.compilation / failedTranslations.length) * 100).toFixed(1)) : 0,
            other: failedTranslations.length > 0 ? 
                parseFloat(((failureReasons.other / failedTranslations.length) * 100).toFixed(1)) : 0
        };

        // 6. Calculate Translation Accuracy
        const compiledTranslations = userTranslations.filter(t => 
            t.status === 'success' || t.status === 'partial_success'
        ).length;

        const translationAccuracy = totalTranslations > 0 ? 
            parseFloat(((compiledTranslations / totalTranslations) * 100).toFixed(1)) : 0;

        // 7. Calculate Compilation Success Rate
        const successfulCompilations = await Compilation.countDocuments({
            userId: userId,
            status: 'success',
            createdAt: { $gte: startDate }
        });

        const totalCompilationAttempts = userCompilations;
        const compilationSuccessRate = totalCompilationAttempts > 0 ? 
            parseFloat(((successfulCompilations / totalCompilationAttempts) * 100).toFixed(1)) : 0;

        // 8. Calculate Most Used Language Pair
        const languagePairs = {};
        userTranslations.forEach(translation => {
            const pair = `${translation.sourceLanguage}→${translation.targetLanguage}`;
            languagePairs[pair] = (languagePairs[pair] || 0) + 1;
        });

        let mostUsedPair = 'None';
        let maxCount = 0;
        for (const [pair, count] of Object.entries(languagePairs)) {
            if (count > maxCount) {
                mostUsedPair = pair;
                maxCount = count;
            }
        }

        // 9. Calculate Average Response Time
        const totalExecutionTime = userTranslations.reduce((sum, t) => sum + (t.executionTime || 0), 0);
        const avgResponseTime = totalTranslations > 0 ? 
            parseFloat((totalExecutionTime / totalTranslations).toFixed(2)) : 0;

        // 10. Get ALL recent activities mixed (translations + compilations)
        const recentTranslations = await Translation.find({
            userId: userId,
            createdAt: { $gte: startDate }
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id sourceLanguage targetLanguage sourceCode createdAt status');

        const recentCompilations = await Compilation.find({
            userId: userId,
            createdAt: { $gte: startDate }
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id language isExecution status createdAt');

        // Create mixed array with type indicator
        const allActivities = [
            ...recentTranslations.map(trans => ({ 
                ...trans.toObject(), 
                activityType: 'translation',
                createdAt: trans.createdAt
            })),
            ...recentCompilations.map(comp => ({ 
                ...comp.toObject(), 
                activityType: 'compilation',
                createdAt: comp.createdAt
            }))
        ];

        // Sort ALL by createdAt (most recent first)
        allActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Take top 10 mixed activities
        const topActivities = allActivities.slice(0, 5);

        // Format mixed activities
        const realActivities = topActivities.map(activity => {
            if (activity.activityType === 'translation') {
                return {
                    id: activity._id.toString(),
                    type: 'translation',
                    title: `Translated ${activity.sourceLanguage} → ${activity.targetLanguage}`,
                    description: `Translated ${activity.sourceCode?.length || 0} characters`,
                    time: formatTimeAgo(activity.createdAt),
                    status: activity.status,
                    languageFrom: activity.sourceLanguage,
                    languageTo: activity.targetLanguage
                };
            } else {
                return {
                    id: activity._id.toString(),
                    type: 'compilation',
                    title: `${activity.isExecution ? 'Executed' : 'Compiled'} ${activity.language} code`,
                    description: activity.status === 'success' ? 'Completed successfully' : 'Failed',
                    time: formatTimeAgo(activity.createdAt),
                    status: activity.status,
                    languageFrom: activity.language
                };
            }
        });

        // 11. Use real activities or show welcome message
        const recentActivities = realActivities.length > 0 ? realActivities : [
            {
                id: 'welcome',
                type: 'translation',
                title: `Welcome, ${req.user.firstName}!`,
                description: 'Start translating or compiling code to see your activities here.',
                time: 'Just now',
                status: 'info',
                languageFrom: 'Python',
                languageTo: 'Java'
            }
        ];

        // 12. Prepare user info
        const user = {
            id: req.user._id,
            name: `${req.user.firstName} ${req.user.lastName}`.trim() || 
                  req.user.username || 
                  req.user.email.split('@')[0],
            email: req.user.email,
            isGuest: false,
            translationsCount: totalTranslations,
            avatar: req.user.profilePicture || '',
            googleId: req.user.googleId,
            provider: req.user.provider,
            isVerified: req.user.isVerified,
            createdAt: req.user.createdAt
        };

        // 13. Create personalized dashboard data
        const dashboardData = {
            success: true,
            recentActivities,
            languageUsage: languageUsage.length > 0 ? languageUsage : [
                { language: 'Start Translating', count: 0, percentage: 100, color: 'bg-blue-500' }
            ],
            performanceMetrics: {
                featureSupportRate,
                failureReasonPercentages,
                codeQuality: featureSupportRate > 90 ? 'Excellent' : 
                            featureSupportRate > 70 ? 'Good' : 
                            totalTranslations > 0 ? 'Needs Improvement' : 'No data',
                uptime: 99.9,
                translationAccuracy,
                compilationSuccessRate,
                mostUsedPair,
                avgResponseTime
            },
            user,
            period,
            totalTranslations,
            totalCompilations: userCompilations,
            featureSupportRate,
            failureReasonPercentages,
            translationAccuracy,
            compilationSuccessRate,
            mostUsedPair,
            avgResponseTime,
            message: totalTranslations > 0 ? 
                `Welcome back, ${user.name}! Here's your activity for the last ${period}.` :
                `Welcome, ${user.name}! Start translating code to see your dashboard come to life.`
        };

        console.log(`📊 Dashboard summary for ${user.email}:`, {
            totalTranslations,
            totalCompilations: userCompilations,
            featureSupportRate: `${featureSupportRate}%`,
            translationAccuracy: `${translationAccuracy}%`,
            compilationSuccessRate: `${compilationSuccessRate}%`,
            mostUsedPair,
            avgResponseTime: `${avgResponseTime}s`,
            recentActivities: realActivities.length,
            mixed: realActivities.map(a => ({ type: a.type, time: a.time }))
        });

        res.json(dashboardData);

    } catch (error) {
        console.error('❌ Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard data',
            error: error.message
        });
    }
});

// Helper function to get color for language
function getColorForLanguage(language) {
    const colorMap = {
        'python': 'bg-blue-500',
        'javascript': 'bg-yellow-500',
        'java': 'bg-red-500',
        'c++': 'bg-purple-500',
        'c': 'bg-gray-600',
        'typescript': 'bg-blue-600',
        'go': 'bg-cyan-500',
        'rust': 'bg-orange-600',
        'ruby': 'bg-red-600',
        'php': 'bg-indigo-500',
        'swift': 'bg-orange-400',
        'kotlin': 'bg-purple-600',
        'dart': 'bg-blue-400',
        'html': 'bg-orange-500',
        'css': 'bg-blue-300',
        'sql': 'bg-gray-500'
    };
    
    const lang = language.toLowerCase();
    return colorMap[lang] || `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
}

// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
        const mins = Math.floor(diffInSeconds / 60);
        return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default router;