import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../context/lib/db';

// ✅ تحميل `WEBHOOK_SECRET`
const webhookSecret = process.env.WEBHOOK_SECRET;

// ✅ التأكد من أن `WEBHOOK_SECRET` موجود
if (!webhookSecret) {
  throw new Error("❌ Missing required environment variable: WEBHOOK_SECRET");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ التحقق من صحة الطلب باستخدام `WEBHOOK_SECRET`
  const secret = req.headers['authorization']?.split('Bearer ')[1];
  if (!secret || secret !== webhookSecret) {
    console.warn("❌ Unauthorized access to /api/subscribe");
    return res.status(403).json({ error: 'Unauthorized request' });
  }

  const { telegram_id, plan_id, payment_id } = req.body;

  if (!telegram_id || !plan_id || !payment_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ✅ التحقق من أن الدفع مسجل مسبقًا
    const existingPayment = await client.query(
      `SELECT * FROM payments WHERE payment_id = $1`,
      [payment_id]
    );

    if (existingPayment.rows.length > 0) {
      console.warn(`⚠️ الدفع مسجل مسبقًا للمستخدم ${telegram_id}, payment_id: ${payment_id}`);
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Payment already processed' });
    }

    // ✅ تسجيل الدفع في قاعدة البيانات
    await client.query(
      `INSERT INTO payments (payment_id, user_id, plan_id, amount, payment_date)
       VALUES ($1, $2, $3, (SELECT price FROM subscription_plans WHERE id = $3), NOW())`,
      [payment_id, telegram_id, plan_id]
    );

    // ✅ تجديد الاشتراك
    const subscriptionResult = await client.query(
      `INSERT INTO subscriptions (user_id, plan_id, expiry_date)
       VALUES ($1, $2, NOW() + INTERVAL '1 month')
       ON CONFLICT (user_id) DO UPDATE
       SET expiry_date = GREATEST(subscriptions.expiry_date, NOW()) + INTERVAL '1 month'
       RETURNING expiry_date`,
      [telegram_id, plan_id]
    );

    // ✅ تسجيل إشعار للمستخدم
    await client.query(
      `INSERT INTO notifications (user_id, message)
       VALUES ($1, $2)`,
      [telegram_id, '✅ تم تجديد اشتراكك بنجاح!']
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      expiry_date: subscriptionResult.rows[0].expiry_date,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ أثناء معالجة الاشتراك:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    client.release();
  }
}
