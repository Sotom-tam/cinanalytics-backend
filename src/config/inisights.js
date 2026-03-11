// routes/projectInsights.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// FUNCTION 1: For feature/page insights (your existing one)
export async function getProjectInsights(projectData) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Changed from 2.5 to stable version
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      }
    });
    
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a product analytics expert. Generate 5-7 key insights about a project's feature usage and page performance. 
              Return insights as a JSON object with an "insights" array containing strings, each starting with an emoji. Keep insights concise and data-driven.
              \n\n${generateFeatureInsightsPrompt(projectData)}` // ✅ Using feature insights prompt
            }
          ]
        }
      ]
    });
    
    const response = result.response;
    const text = response.text();
    const insights = JSON.parse(text);
    return insights.insights;

  } catch (error) {
    console.error('Insights generation failed:', error);
    throw error; // Don't use res here, just throw
  }
}

// FUNCTION 2: For project overview/details page (NEW)
export async function getKeyInsightProjectOverview(projectData) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a product strategy expert analyzing a project's overall profile and performance. 
              Generate 4-6 strategic insights about this project based on its description, metrics, and usage patterns.
              
              Focus on:
              - Project positioning and target audience fit
              - Growth opportunities based on the data
              - Potential concerns or red flags
              - Strategic recommendations for improvement
              
              Return insights as a JSON object with an "insights" array containing strings.
              Make insights actionable and specific to this project.
              \n\n${generateProjectOverviewPrompt(projectData)}` // ✅ Using NEW overview prompt
            }
          ]
        }
      ]
    });

    const response = result.response;
    const text = response.text();
    const insights = JSON.parse(text);
    return insights.insights;

  } catch (error) {
    console.error('Project overview insights generation failed:', error);
    throw error;
  }
}

// PROMPT 1: For feature/page insights (renamed from generatePrompt)
function generateFeatureInsightsPrompt(data) {
  return `Generate key insights for the project "${data.projectData?.project_name || 'Unknown'}" based on this data:

PROJECT OVERVIEW:
- Weekly interactions: ${data.projectData?.project_interactions_this_week || '0'} (${data.projectData?.project_interactions_change_percent || '0'}% vs last week)
- Active users: ${data.projectData?.active_users_this_week || '0'} (${data.projectData?.active_users_last_week || '0'} last week)
- Avg session time: ${data.projectData?.avg_session_time_this_week || '0'}s (${data.projectData?.avg_session_time_change_percent || '0'}% change)

FEATURE METRICS:
- Total features: ${data.projectFeature?.total_features || '0'}
- Unused features: ${data.projectFeature?.unused_features || '0'}

TOP FEATURES (most used):
${data.mostUsedFeatures?.slice(0, 3).map(f => 
  `- ${f.feature_name}: ${f.total_interactions} interactions (${f.feature_usage}% of monthly activity)`
).join('\n') || 'No data available'}

LEAST USED FEATURES:
${data.leastUsedFeatures?.slice(0, 3).map(f => 
  `- ${f.feature_name}: Only ${f.total_interactions} interactions (${f.feature_usage}% of monthly activity)`
).join('\n') || 'No data available'}

PAGE PERFORMANCE:
- Most visited: ${data.mostVisitedPages?.[0]?.page_name || 'N/A'} (${data.mostVisitedPages?.[0]?.page_visits || '0'} visits)
- Least visited: ${data.leastVisitedPages?.[0]?.page_name || 'N/A'} (${data.leastVisitedPages?.[0]?.page_visits || '0'} visits)

Return a JSON object with an "insights" array containing 5-7 insight strings, each starting with an appropriate emoji.`;
}

// PROMPT 2: NEW prompt for project overview/details page
// NEW prompt function for project overview insights - updated for the new data structure
function generateProjectOverviewPrompt(data) {
  const summaryData = data.summaryData || {};
  const leastUsedFeatures = data.leastUsedFeatures || [];
  const chartData = data.chartData || [];
  
  // Get unique projects from chartData for project list
  const uniqueProjects = [...new Map(chartData.map(item => [item.project_key, item])).values()];
  
  // Calculate top trends from chartData
  const recentMonths = [...new Set(chartData.map(item => item.month_value))].sort().reverse().slice(0, 3);
  
  // Get most recent month's data
  const latestMonth = recentMonths[0];
  const latestMonthData = chartData.filter(item => item.month_value === latestMonth);
  
  // Calculate growth trends
  let totalInteractionsTrend = 'stable';
  if (chartData.length > 0) {
    const oldestMonth = recentMonths[recentMonths.length - 1];
    const oldestTotal = chartData
      .filter(item => item.month_value === oldestMonth)
      .reduce((sum, item) => sum + parseInt(item.project_interactions || '0'), 0);
    const latestTotal = latestMonthData.reduce((sum, item) => sum + parseInt(item.project_interactions || '0'), 0);
    
    if (latestTotal > oldestTotal * 1.1) totalInteractionsTrend = 'growing';
    else if (latestTotal < oldestTotal * 0.9) totalInteractionsTrend = 'declining';
  }

  // Group least used features by project for better analysis
  const featuresByProject = {};
  leastUsedFeatures.forEach(feature => {
    if (!featuresByProject[feature.project_key]) {
      featuresByProject[feature.project_key] = {
        project_name: feature.project_name,
        features: []
      };
    }
    featuresByProject[feature.project_key].features.push(feature);
  });

  // Get top 3 projects with most unused features
  const projectsWithUnusedFeatures = Object.values(featuresByProject)
    .map(p => ({
      name: p.project_name,
      count: p.features.length,
      examples: p.features.slice(0, 2).map(f => f.feature_name).join(', ')
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return `Analyze this portfolio of projects and provide strategic insights:

PORTFOLIO SUMMARY:
- Total Connected Projects: ${summaryData.connected_projects || '0'}
- Active Projects: ${summaryData.active_projects || '0'}
- Total Active Users: ${summaryData.active_users || '0'}
- Features Tracked: ${summaryData.features_tracked || '0'}

CURRENT PROJECTS:
${uniqueProjects.map(p => `- ${p.project_name}`).join('\n')}

RECENT ACTIVITY (Latest Month: ${latestMonth ? new Date(latestMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}):
${latestMonthData.map(p => `- ${p.project_name}: ${p.project_interactions} interactions`).join('\n')}

OVERALL TREND: Portfolio interactions are ${totalInteractionsTrend} across ${recentMonths.length} months

FEATURES AT RISK (Least Used Features):
${projectsWithUnusedFeatures.map(p => 
  `- ${p.name}: ${p.count} underutilized features (e.g., ${p.examples})`
).join('\n')}

TOP PERFORMING PROJECTS (by recent interactions):
${latestMonthData.sort((a, b) => b.project_interactions - a.project_interactions).slice(0, 3).map((p, i) => 
  `- ${i+1}. ${p.project_name}: ${p.project_interactions} interactions`
).join('\n')}

Based on this portfolio data, provide 4-6 strategic insights about:

1. **Portfolio Health**: Overall assessment of the project portfolio
2. **Growth Opportunities**: Which projects show the most potential?
3. **Risk Areas**: Projects or features that need attention
4. **Feature Optimization**: How to improve adoption of underutilized features
5. **Engagement Patterns**: Trends in user activity across projects
6. **Recommendations**: 2-3 actionable next steps for the portfolio

Return a JSON object with an "insights" array containing these insights. Each insight must:
- Be specific and data-driven
- Reference actual numbers from the data
- Include actionable observations

Example insights:
" Your portfolio has ${summaryData.active_projects || '0'} active projects with ${summaryData.active_users || '0'} total users - consider cross-promotion strategies to increase user adoption across projects."
" ${projectsWithUnusedFeatures[0]?.name || 'A project'} has ${projectsWithUnusedFeatures[0]?.count || '0'} underutilized features. Consider A/B testing feature discovery or removing low-value features."
" Overall portfolio interactions are ${totalInteractionsTrend} - ${totalInteractionsTrend === 'growing' ? 'great momentum!' : 'consider investigating what\'s causing the decline.'}"`;
}