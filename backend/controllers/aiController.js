const ClaudeService = require('../services/claudeService');
const Transaction = require('../models/Transaction');

class AIController {
  /**
   * Generate cash flow forecast
   */
  static async generateForecast(req, res) {
    try {
      // Get last 90 days of transactions
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const transactions = await Transaction.find({
        userId: req.user._id,
        date: { $gte: ninetyDaysAgo }
      })
        .select('type amount category date paymentMethod')
        .sort({ date: -1 })
        .lean();

      if (transactions.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Need at least 5 transactions to generate a forecast'
        });
      }

      const forecast = await ClaudeService.generateForecast(transactions, req.user);

      res.json({
        success: true,
        data: {
          ...forecast,
          generatedAt: new Date(),
          transactionCount: transactions.length
        }
      });
    } catch (error) {
      console.error('Forecast generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate forecast'
      });
    }
  }

  /**
   * Generate dashboard insights
   */
  static async generateInsights(req, res) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const transactions = await Transaction.find({
        userId: req.user._id,
        date: { $gte: thirtyDaysAgo }
      }).lean();

      const summary = {
        totalIncome: 0,
        totalExpenses: 0,
        categories: {}
      };

      transactions.forEach(t => {
        if (t.type === 'income') {
          summary.totalIncome += t.amount;
        } else {
          summary.totalExpenses += t.amount;
        }
        summary.categories[t.category] = (summary.categories[t.category] || 0) + t.amount;
      });

      summary.netCashFlow = summary.totalIncome - summary.totalExpenses;
      summary.topCategories = Object.entries(summary.categories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, amount]) => ({ name, amount }));

      const insights = await ClaudeService.generateInsights(summary);

      res.json({
        success: true,
        data: {
          insights,
          summary,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Insights generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate insights'
      });
    }
  }
}

module.exports = AIController;