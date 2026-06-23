const Transaction = require('../models/Transaction');
const User = require('../models/User');

class TransactionController {
  /**
   * Get transactions with pagination and filters
   */
  static async getTransactions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        category,
        from,
        to,
        search
      } = req.query;

      const query = { userId: req.user._id };

      // Apply filters
      if (type && ['income', 'expense'].includes(type)) {
        query.type = type;
      }

      if (category) {
        query.category = category;
      }

      if (from || to) {
        query.date = {};
        if (from) query.date.$gte = new Date(from);
        if (to) query.date.$lte = new Date(to);
      }

      if (search) {
        query.$or = [
          { note: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      // Check free plan transaction limit
      if (req.user.plan === 'free') {
        const totalCount = await Transaction.countDocuments({ userId: req.user._id });
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const monthlyCount = await Transaction.countDocuments({
          userId: req.user._id,
          createdAt: { $gte: startOfMonth }
        });

        res.set('X-Monthly-Transactions', monthlyCount);
        res.set('X-Monthly-Limit', 50);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Transaction.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions'
      });
    }
  }

  /**
   * Create transaction
   */
  static async createTransaction(req, res) {
    try {
      // Check free plan limits
      if (req.user.plan === 'free') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const monthlyCount = await Transaction.countDocuments({
          userId: req.user._id,
          createdAt: { $gte: startOfMonth }
        });

        if (monthlyCount >= 50) {
          return res.status(403).json({
            success: false,
            message: 'Monthly transaction limit reached. Upgrade to Pro for unlimited transactions.',
            code: 'LIMIT_REACHED'
          });
        }
      }

      const transaction = new Transaction({
        userId: req.user._id,
        type: req.body.type,
        amount: req.body.amount,
        currency: req.body.currency || req.user.currency,
        category: req.body.category,
        paymentMethod: req.body.paymentMethod || 'Cash',
        date: req.body.date || new Date(),
        note: req.body.note || ''
      });

      await transaction.save();

      res.status(201).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transaction'
      });
    }
  }

  /**
   * Update transaction
   */
  static async updateTransaction(req, res) {
    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Update fields
      const allowedUpdates = ['type', 'amount', 'currency', 'category', 'paymentMethod', 'date', 'note'];
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          transaction[field] = req.body[field];
        }
      });

      await transaction.save();

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction'
      });
    }
  }

  /**
   * Delete transaction
   */
  static async deleteTransaction(req, res) {
    try {
      const transaction = await Transaction.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transaction'
      });
    }
  }

  /**
   * Import transactions from CSV
   */
  static async importCSV(req, res) {
    try {
      if (!req.body.transactions || !Array.isArray(req.body.transactions)) {
        return res.status(400).json({
          success: false,
          message: 'No transactions provided'
        });
      }

      const results = {
        imported: 0,
        failed: 0,
        errors: []
      };

      for (const row of req.body.transactions) {
        try {
          const transaction = new Transaction({
            userId: req.user._id,
            type: row.type?.toLowerCase() || 'expense',
            amount: parseFloat(row.amount) || 0,
            currency: row.currency || req.user.currency,
            category: row.category || 'Other Expense',
            paymentMethod: row.paymentMethod || 'Cash',
            date: row.date ? new Date(row.date) : new Date(),
            note: row.note || ''
          });

          await transaction.save();
          results.imported++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            row: row,
            error: err.message
          });
        }
      }

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import transactions'
      });
    }
  }

  /**
   * Export transactions as CSV
   */
  static async exportCSV(req, res) {
    try {
      const transactions = await Transaction.find({ userId: req.user._id })
        .sort({ date: -1 })
        .lean();

      // Generate CSV
      const headers = 'Date,Type,Category,Amount,Currency,Payment Method,Note\n';
      const rows = transactions.map(t => 
        `${t.date.toISOString().split('T')[0]},${t.type},${t.category},${t.amount},${t.currency},${t.paymentMethod},"${t.note?.replace(/"/g, '""') || ''}"`
      ).join('\n');

      const csv = headers + rows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=flowsmart-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export transactions'
      });
    }
  }
}

module.exports = TransactionController;