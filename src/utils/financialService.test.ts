// Test file for the simplified Financial Service
// Focuses on core receipt functionality: package + registration - discount

import { FinancialService } from './financialService';

// Mock test data
const mockReceiptData = {
    member_id: "member123",
    member_name: "John Doe",
    registration_fee: 500,
    package_fee: 1500,
    discount: 100,
    plan_type: "monthly",
    subscription_start_date: "2025-01-31",
    subscription_end_date: "2025-02-28",
    payment_type: "upi" as const,
    transaction_type: "payment" as const,
    created_by: "Admin"
};

// Test scenarios
export const testFinancialWorkflows = async () => {
    console.log("🧪 Testing Simplified Financial Service");

    // Test 1: Simple receipt creation
    console.log("\n1. Testing simple receipt creation...");
    try {
        const result = await FinancialService.createSimpleReceipt(mockReceiptData);

        if (result.success) {
            console.log("✅ Receipt created:", result.receipt?.receipt_number);
            console.log("✅ Amount calculated:", result.receipt?.amount);
            console.log("✅ Calculation: 500 + 1500 - 100 =", result.receipt?.amount);
            console.log("✅ Description:", result.receipt?.description);
        } else {
            console.log("❌ Receipt creation failed:", result.error);
        }
    } catch (error) {
        console.log("❌ Test failed:", error);
    }

    // Test 2: Renewal receipt
    console.log("\n2. Testing renewal receipt...");
    try {
        const renewalData = {
            ...mockReceiptData,
            transaction_type: "renewal" as const,
            registration_fee: 0, // No registration fee for renewals
            package_fee: 1500,
            discount: 50
        };

        const result = await FinancialService.createSimpleReceipt(renewalData);

        if (result.success) {
            console.log("✅ Renewal receipt created:", result.receipt?.receipt_number);
            console.log("✅ Amount calculated:", result.receipt?.amount);
            console.log("✅ Calculation: 0 + 1500 - 50 =", result.receipt?.amount);
            console.log("✅ Description:", result.receipt?.description);
        } else {
            console.log("❌ Renewal receipt failed:", result.error);
        }
    } catch (error) {
        console.log("❌ Renewal test failed:", error);
    }

    // Test 3: Financial summary
    console.log("\n3. Testing financial summary...");
    try {
        const summary = await FinancialService.getFinancialSummary();
        console.log("✅ Financial Summary:");
        console.log("   Total Revenue:", summary.totalRevenue);
        console.log("   Total Receipts:", summary.totalReceipts);
        console.log("   Average Receipt Amount:", summary.averageReceiptAmount);
        console.log("   Total Invoices:", summary.totalInvoices);
    } catch (error) {
        console.log("❌ Financial summary test failed:", error);
    }

    console.log("\n🏁 Financial Service Tests Complete");
};

// Example of correct calculation
export const demonstrateCalculation = () => {
    console.log("\n🧮 Receipt Amount Calculation Examples:");
    console.log("===========================================");

    const examples = [
        { reg: 500, pkg: 1500, disc: 100, desc: "New monthly membership" },
        { reg: 0, pkg: 4200, disc: 200, desc: "Quarterly renewal" },
        { reg: 1000, pkg: 14400, disc: 1000, desc: "Yearly membership with discount" },
        { reg: 0, pkg: 1500, disc: 0, desc: "Monthly renewal, no discount" }
    ];

    examples.forEach((ex, index) => {
        const total = Math.max(0, ex.reg + ex.pkg - ex.disc);
        console.log(`\n${index + 1}. ${ex.desc}:`);
        console.log(`   Registration: ₹${ex.reg}`);
        console.log(`   Package: ₹${ex.pkg}`);
        console.log(`   Discount: ₹${ex.disc}`);
        console.log(`   Total: ₹${ex.reg} + ₹${ex.pkg} - ₹${ex.disc} = ₹${total}`);
    });

    console.log("\n===========================================");
};

export default { testFinancialWorkflows, demonstrateCalculation };