import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Expense } from './entities/expense.entity';

@Injectable()
export class FinanceService {
  constructor(private readonly dataSource: DataSource) {}

  async createExpense(tenantId: string, userId: string, data: { label: string; amount: number; paymentMethod: string; notes?: string }) {
    const repo = this.dataSource.getRepository(Expense);
    const expense = repo.create({ ...data, tenantId, userId });
    return repo.save(expense);
  }

  async getDailyRegister(tenantId: string, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString();

    const salesBreakdown = await this.dataSource.query(
      `SELECT 
         payment_method, 
         SUM(total_ttc)::numeric(15,2) as total_collected,
         COUNT(id)::int as transactions_count
       FROM invoices
       WHERE tenant_id = $1 
         AND created_at BETWEEN $2 AND $3
         AND status = 'PAID'
       GROUP BY payment_method`,
      [tenantId, startOfDay, endOfDay],
    );

    const expensesBreakdown = await this.dataSource.query(
      `SELECT 
         payment_method, 
         SUM(amount)::numeric(15,2) as total_expenses,
         COUNT(id)::int as count
       FROM expenses
       WHERE tenant_id = $1 
         AND created_at BETWEEN $2 AND $3
       GROUP BY payment_method`,
      [tenantId, startOfDay, endOfDay],
    );

    const summaryMap: Record<string, { in: number; out: number; balance: number }> = {};

    salesBreakdown.forEach((s: any) => {
      summaryMap[s.payment_method] = {
        in: parseFloat(s.total_collected) || 0,
        out: 0,
        balance: parseFloat(s.total_collected) || 0,
      };
    });

    expensesBreakdown.forEach((e: any) => {
      const current = summaryMap[e.payment_method] || { in: 0, out: 0, balance: 0 };
      current.out = parseFloat(e.total_expenses) || 0;
      current.balance = current.in - current.out;
      summaryMap[e.payment_method] = current;
    });

    const operatorAudit = await this.dataSource.query(
      `SELECT 
         u.full_name as operator_name,
         COUNT(i.id)::int as sales_count,
         COALESCE(SUM(i.total_ttc), 0)::numeric(15,2) as total_sold
       FROM users u
       LEFT JOIN invoices i ON i.user_id = u.id 
         AND i.created_at BETWEEN $2 AND $3
         AND i.status = 'PAID'
       WHERE u.tenant_id = $1
       GROUP BY u.id, u.full_name
       ORDER BY total_sold DESC`,
      [tenantId, startOfDay, endOfDay],
    );

    return {
      date: startOfDay.substring(0, 10),
      summaryByMethod: summaryMap,
      operatorAudit,
    };
  }

  async getExpenses(tenantId: string, limit = 50) {
    return this.dataSource
      .getRepository(Expense)
      .createQueryBuilder('e')
      .where('e.tenant_id = :tenantId', { tenantId })
      .orderBy('e.created_at', 'DESC')
      .take(limit)
      .getMany();
  }
}
