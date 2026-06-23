const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');

class ReportController {
  /**
   * Get monthly profit & loss report
   */
  static async getMonthlyReport(req, res) {
    try {
      const { month } = req.query; // Format: YYYY-MM
      if (!month) {
        return res.status(400).json({
          success: false,
          message: 'Month parameter required (YYYY-MM)'
        });
      }

      const [year, monthNum] = month.split('-');
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);

      const transactions = await Transaction.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      }).lean();

      // Calculate income by category
      const incomeByCategory = {};
      const expenseByCategory = {};

      let totalIncome = 0;
      let totalExpenses = 0;

      transactions.forEach(t => {
        if (t.type === 'income') {
          incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
          totalIncome += t.amount;
        } else {
          expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
          totalExpenses += t.amount;
        }
      });

      res.json({
        success: true,
        data: {
          month,
          totalIncome,
          totalExpenses,
          netIncome: totalIncome - totalExpenses,
          incomeByCategory,
          expenseByCategory,
          transactionCount: transactions.length
        }
      });
    } catch (error) {
      console.error('Monthly report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate monthly report'
      });
    }
  }

  /**
   * Get annual tax-ready summary
   */
  static async getAnnualReport(req, res) {
    try {
      const { year } = req.query;
      if (!year) {
        return res.status(400).json({
          success: false,
          message: 'Year parameter required'
        });
      }

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);

      const transactions = await Transaction.find({
        userId: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      }).lean();

      // Monthly breakdown
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(year, i).toLocaleString('default', { month: 'short' }),
        income: 0,
        expenses: 0,
        net: 0
      }));

      let totalIncome = 0;
      let totalExpenses = 0;

      transactions.forEach(t => {
        const monthIndex = new Date(t.date).getMonth();
        if (t.type === 'income') {
          monthlyData[monthIndex].income += t.amount;
          totalIncome += t.amount;
        } else {
          monthlyData[monthIndex].expenses += t.amount;
          totalExpenses += t.amount;
        }
      });

      monthlyData.forEach(m => {
        m.net = m.income - m.expenses;
      });

      res.json({
        success: true,
        data: {
          year,
          totalIncome,
          totalExpenses,
          netIncome: totalIncome - totalExpenses,
          monthlyData,
          transactionCount: transactions.length
        }
      });
    } catch (error) {
      console.error('Annual report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate annual report'
      });
    }
  }

  /**
   * Get dashboard summary KPIs
   */
  static async getSummary(req, res) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

      // Get recent transactions
      const [recentTransactions, allTransactions] = await Promise.all([
        Transaction.find({
          userId: req.user._id,
          date: { $gte: thirtyDaysAgo }
        }).lean(),
        Transaction.find({
          userId: req.user._id,
          date: { $gte: ninetyDaysAgo }
        }).lean()
      ]);

      // Calculate 30-day metrics
      let thirtyDayIncome = 0;
      let thirtyDayExpenses = 0;
      const expenseByCategory = {};

      recentTransactions.forEach(t => {
        if (t.type === 'income') {
          thirtyDayIncome += t.amount;
        } else {
          thirtyDayExpenses += t.amount;
          expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
        }
      });

      // Calculate 90-day monthly averages
      const monthlyData = {};
      allTransactions.forEach(t => {
        const monthKey = t.date.toISOString().substring(0, 7);
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        if (t.type === 'income') {
          monthlyData[monthKey].income += t.amount;
        } else {
          monthlyData[monthKey].expenses += t.amount;
        }
      });

      const months = Object.keys(monthlyData);
      const avgMonthlyExpenses = months.length > 0
        ? Object.values(monthlyData).reduce((sum, m) => sum + m.expenses, 0) / months.length
        : thirtyDayExpenses;

      // Calculate cash runway
      const netCashFlow = thirtyDayIncome - thirtyDayExpenses;
      const cashRunway = avgMonthlyExpenses > 0
        ? Math.round((thirtyDayIncome / avgMonthlyExpenses) * 30)
        : 0;

      res.json({
        success: true,
        data: {
          totalRevenue: thirtyDayIncome,
          totalExpenses: thirtyDayExpenses,
          netCashFlow,
          cashRunway,
          expenseBreakdown: Object.entries(expenseByCategory)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount),
          transactionCount: recentTransactions.length
        }
      });
    } catch (error) {
      console.error('Summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate summary'
      });
    }
  }
}

module.exports = ReportController;