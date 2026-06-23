const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class ClaudeService {
  /**
   * Generate cash flow forecast based on transaction history
   */
  static async generateForecast(transactions, user) {
    const prompt = `You are a financial analyst for small businesses in Uganda.
Given the last 90 days of transactions as JSON, respond ONLY
with this exact JSON structure (no markdown, no preamble):

{
  "healthScore": 72,
  "summary": "Your business has a moderate financial health score of 72. Cash flow is positive but declining...",
  "forecast": [
    { "week": "Week 1", "projected": 1200000 },
    { "week": "Week 2", "projected": 980000 },
    { "week": "Week 3", "projected": 1100000 },
    { "week": "Week 4", "projected": 750000 }
  ],
  "riskDates": ["2025-08-14"],
  "topDrains": [
    { "category": "Rent", "percent": 34 },
    { "category": "Salaries", "percent": 28 },
    { "category": "Stock", "percent": 19 }
  ],
  "recommendations": [
    "Your rent is 34% of expenses. Consider renegotiating lease terms...",
    "You have 18 days of cash runway. Build emergency reserves...",
    "Stock purchases spike every Monday. Optimize ordering schedule..."
  ]
}

Here is the transaction data:
${JSON.stringify(transactions, null, 2)}

Business Context:
- Industry: ${user.industry || 'General'}
- Location: ${user.location || 'Uganda'}
- Currency: ${user.currency}
`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    try {
      const textContent = response.content[0].text;
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(textContent);
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      throw new Error('Failed to parse AI forecast response');
    }
  }

  /**
   * Generate dashboard insights based on financial summary
   */
  static async generateInsights(summary) {
    const prompt = `You are a financial health assistant. Given a summary of this
business's finances (total income, expenses, net, top categories),
respond ONLY with a JSON array of 4 insight strings:

["Insight 1", "Insight 2", "Insight 3", "Insight 4"]

Financial Summary:
${JSON.stringify(summary, null, 2)}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    try {
      const textContent = response.content[0].text;
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(textContent);
    } catch (error) {
      console.error('Error parsing Claude insights:', error);
      throw new Error('Failed to parse AI insights response');
    }
  }

  /**
   * Analyze transaction patterns for anomaly detection
   */
  static async detectAnomalies(transactions) {
    const prompt = `Analyze these transactions for unusual patterns or anomalies.
Respond with a JSON array of anomaly objects:
[{"date": "2025-01-15", "description": "Unusually high expense...", "severity": "high"}]

Transactions:
${JSON.stringify(transactions.slice(0, 200), null, 2)}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    try {
      const textContent = response.content[0].text;
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Error parsing anomaly detection:', error);
      return [];
    }
  }
}

module.exports = ClaudeService;