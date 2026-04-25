const excel = require('exceljs');
const connectDB = require('../lib/db');
const Loan = require('../models/loan.model');
const Payment = require('../models/payment.model');
const Member = require('../models/member.model');
const CapitalBuild = require('../models/capitalBuild.model');

exports.generateLoanReport = async (req, res) => {
  try {
    await connectDB();

    const loans = await Loan.find({})
      .populate({
        path: 'employee', // The virtual field to populate
        model: 'Member', // Explicitly specify the model
        select: 'firstName lastName middleName employeeId' // Select fields
      })
      .populate({
        path: 'loanType',
        model: 'LoanType',
        foreignField: 'loanTypeCode',
        localField: 'loanType',
        select: 'loanTypeName'
      });

    const payments = await Payment.find({});
    const paymentsByLoanId = payments.reduce((acc, payment) => {
      if (!acc[payment.loanId]) {
        acc[payment.loanId] = 0;
      }
      acc[payment.loanId] += payment.amountPaid;
      return acc;
    }, {});

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Loan Report');

    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Loan Type', key: 'loanType', width: 20 },
      { header: 'Loan ID', key: 'loanId', width: 15 },
      { header: 'Loan Date', key: 'loanDate', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'Loan Amount', key: 'loanAmount', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Maturity Date', key: 'maturityDate', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'Loan Term', key: 'loanTerm', width: 10 },
      { header: 'Interest', key: 'interest', width: 10, style: { numFmt: '0.00%' } },
      { header: 'Monthly Payment', key: 'monthlyPayment', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Total Payable', key: 'totalPayable', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Amount Paid', key: 'amountPaid', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Remaining Balance', key: 'remainingBalance', width: 20, style: { numFmt: '#,##0.00' } },
    ];

    worksheet.getRow(1).font = { bold: true };

    loans.forEach(loan => {
      const employee = loan.employee;
      const fullName = employee ? `${employee.lastName}, ${employee.firstName} ${employee.middleName || ''}`.trim() : 'N/A';
      const amountPaid = paymentsByLoanId[loan.loanId] || 0;
      const remainingBalance = loan.totalPayable - amountPaid;

      worksheet.addRow({
        fullName,
        branch: loan.branch,
        loanType: loan.loanType ? loan.loanType.loanTypeName : 'N/A',
        loanId: loan.loanId,
        loanDate: loan.loanDate,
        loanAmount: loan.loanAmount,
        maturityDate: loan.maturityDate,
        loanTerm: loan.loanTerm,
        interest: loan.interest / 100, // Assuming interest is stored as a percentage value e.g. 5 for 5%
        monthlyPayment: loan.monthlyPayment,
        totalPayable: loan.totalPayable,
        amountPaid,
        remainingBalance,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'Loan_Report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('GenerateLoanReport error:', err);
    res.status(500).json({ error: 'Failed to generate loan report', details: err.message });
  }
};

exports.generateMemberReport = async (req, res) => {
  try {
    await connectDB();

    const members = await Member.find({});

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Member Report');

    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone Number', key: 'phoneNumber', width: 20 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Employment Date', key: 'dateOfJoining', width: 20, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'Membership Status', key: 'membershipStatus', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    members.forEach(member => {
      const fullName = `${member.lastName}, ${member.firstName} ${member.middleName || ''}`.trim();
      
      worksheet.addRow({
        employeeId: member.employeeId,
        fullName: fullName,
        email: member.email,
        phoneNumber: member.phoneNumber,
        address: member.address,
        branch: member.branch ?? 'N/A',
        dateOfJoining: member.dateOfJoining,
        membershipStatus: member.membershipStatus,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Member_Report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('GenerateMemberReport error:', err);
    res.status(500).json({ error: 'Failed to generate member report', details: err.message });
  }
};

exports.generatePaymentReport = async (req, res) => {
  try {
    await connectDB();

    const payments = await Payment.find({})
      .populate({
        path: 'member',
        model: 'Member',
        select: 'employeeId firstName lastName middleName'
      });

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Payment Report');

    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Middle Name', key: 'middleName', width: 15 },
      { header: 'Payment Date', key: 'paymentDate', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'Amount Paid', key: 'amountPaid', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Interest Rebate', key: 'interestRebate', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Fully Paid', key: 'isFullPayment', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    payments.forEach(payment => {
      const member = payment.member;
      if (member) {
        worksheet.addRow({
          employeeId: member.employeeId,
          firstName: member.firstName,
          lastName: member.lastName,
          middleName: member.middleName || '',
          paymentDate: payment.paymentDate,
          amountPaid: payment.amountPaid,
          interestRebate: payment.interestRebate,
          isFullPayment: payment.isFullPayment ? 'Yes' : 'No',
        });
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Payment_Report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('GeneratePaymentReport error:', err);
    res.status(500).json({ error: 'Failed to generate payment report', details: err.message });
  }
};

exports.generateCapitalReport = async (req, res) => {
  try {
    await connectDB();

    const contributions = await Payment.find({ paymentType: '', loanId: '' })
      .populate({
        path: 'employeeId',
        model: 'Member',
        foreignField: 'employeeId',
        localField: 'employeeId',
        select: 'employeeId firstName lastName middleName'
      })
      .sort({ 'employeeId.lastName': 1, 'employeeId.firstName': 1, paymentDate: 1 });

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Capital Build Up Report');

    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Contribution Amount', key: 'contributionAmount', width: 20, style: { numFmt: '#,##0.00' } },
      { header: 'Contribution Date', key: 'contributionDate', width: 20, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'Contribution Month', key: 'contributionMonth', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    contributions.forEach(item => {
      if (item.employeeId && typeof item.employeeId === 'object') { // Check if populated
        const member = item.employeeId;
        const fullName = `${member.lastName}, ${member.firstName} ${member.middleName || ''}`.trim();
        const contributionMonth = item.paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        worksheet.addRow({
          employeeId: member.employeeId,
          fullName: fullName,
          contributionAmount: item.amountPaid,
          contributionDate: item.paymentDate,
          contributionMonth: contributionMonth,
        });
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Capital_Build_Up_Report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('GenerateCapitalReport error:', err);
    res.status(500).json({ error: 'Failed to generate capital report', details: err.message });
  }
};