# نظام الدفع والسحب - CreatorMarket

## نظرة عامة
نظام دفع وسحب احترافي مشابه لـ Fiverr مع دعم Visa و Mastercard و PayPal.

---

## 1. قاعدة البيانات

### Firestore Collections

#### `wallets`
```javascript
{
  userId: string,           // معرف المستخدم
  availableBalance: number, // الرصيد المتاح للسحب
  pendingBalance: number,   // الرصيد المعلق (awaiting completion)
  frozenBalance: number,    // الرصيد المجمد (في نزاع)
  totalEarned: number,     // إجمالي المكسب
  totalWithdrawn: number,    // إجمالي السحب
  paypalEmail: string,      // بريد PayPal
  bankAccount: object,     // تفاصيل البنك
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `orders`
```javascript
{
  orderId: string,          // رقم الطلب
  buyerId: string,          // معرف المشتري
  sellerId: string,         // معرف البائع
  serviceId: string,        // معرف الخدمة
  amount: number,          // المبلغ
  fees: number,            // العمولة (10%)
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disputed',
  paymentMethod: 'visa' | 'mastercard' | 'paypal',
  paymentStatus: 'pending' | 'held' | 'released' | 'refunded',
  escrowId: string,        // معرف الضمان
  deliverables: string[],  // الملفات المسلمة
  dueDate: timestamp,
  completedAt: timestamp,
  releasedAt: timestamp,
  createdAt: timestamp
}
```

#### `withdrawals`
```javascript
{
  withdrawalId: string,
  userId: string,
  amount: number,
  method: 'paypal' | 'bank' | 'visa',
  status: 'pending' | 'processing' | 'completed' | 'rejected',
  processingFee: number,
  netAmount: number,
  processedAt: timestamp,
  createdAt: timestamp
}
```

#### `transactions`
```javascript
{
  transactionId: string,
  userId: string,
  type: 'deposit' | 'withdrawal' | 'earning' | 'fee' | 'refund',
  amount: number,
  balance: number,         // الرصيد بعد
  description: string,
  orderId: string,
  withdrawalId: string,
  createdAt: timestamp
}
```

---

## 2. Wallet Page (المحفظة)

### الواجهة
- **Header**: عنوان + رصيد متاح كبير
- **Cards**: 3 بطاقات (متاح، معلق، مجمد)
- **Transaction History**: سجل العمليات
- **Withdraw Button**: زر السحب

### الرصيد
```javascript
// Available = الرصيد المتاح
// Pending = في انتظار اكتمال المشروع
// Frozen = في نزاع
```

---

## 3. Payments Page (الدفع)

### طرق الدفع المدعومة
1. **Visa/Mastercard** - عبر Stripe
2. **PayPal** - عبر PayPal SDK

### Checkout Flow
1. اختيار Methode
2. إدخال بيانات البطاقة
3. تأكيد الدفع
4. حفظ في Escrow

---

## 4. Escrow System

### مراحل Escrow
```
[الدفع] → [Pending] → [In Progress] → [Completed] → [Released]
                         ↓
                      [Disputed] → [Frozen]
```

### Automatic Release
- المشتري يضغط "Mark as Complete"
- أو تلقائياً بعد 3 أيام

---

## 5.Withdraw Page

### الطرائق
- PayPal
- Bank Transfer  
- Visa Direct Payout

### الحالة
```
Pending → Processing → Completed/Rejected
```

### Timing
- PayPal: دقائق - 24 ساعة
- Visa: 1-3 أيام
- Bank: 1-5 أيام

---

## 6. Admin Panel

### الوظائف
- عرض جم��ع المحافظ
- تحويل الفلوس بين المستخدمين
- تجميد الحسابات
- معالجة الشكاوى
- السحب اليدوي

---

## 7. الأمان

- Stripe Elements (PCI Compliant)
- 2FA عند السحب
- Email + SMS Verification
- Rate Limiting

---

## 8. العمولات

- **المنصة**: 10% من كل طلب
- **Processing Fee**: على المستخدم (اختياري)