const excel = require('exceljs');
const PDFDocument = require('pdfkit');
const connectDB = require('../lib/db');
const Loan = require('../models/loan.model');
const Payment = require('../models/payment.model');
const Member = require('../models/member.model');

exports.generateLoanReport = async (req, res) => {
  try {
    await connectDB();

    const loans = await Loan.find({})
      .populate({
        path: 'employee',
        model: 'Member',
        select: 'firstName lastName middleName employeeId branch'
      })
      .populate({
        path: 'loanType',
        model: 'LoanType',
        foreignField: 'loanTypeCode',
        localField: 'loanType',
        select: 'loanTypeName'
      });

    // Sort loans by branch, then last name, then first name, then loan date
    const sortedLoans = loans.sort((a, b) => {
      const branchA = a.employee?.branch || 'ZZZ';
      const branchB = b.employee?.branch || 'ZZZ';

      // First compare by branch
      const branchCompare = branchA.localeCompare(branchB);
      if (branchCompare !== 0) return branchCompare;

      // Then compare by last name
      const lastNameA = a.employee?.lastName || '';
      const lastNameB = b.employee?.lastName || '';
      const lastNameCompare = lastNameA.localeCompare(lastNameB);
      if (lastNameCompare !== 0) return lastNameCompare;

      // Then compare by first name
      const firstNameA = a.employee?.firstName || '';
      const firstNameB = b.employee?.firstName || '';
      const firstNameCompare = firstNameA.localeCompare(firstNameB);
      if (firstNameCompare !== 0) return firstNameCompare;

      // Finally compare by loan date (oldest first)
      const dateA = new Date(a.loanDate).getTime();
      const dateB = new Date(b.loanDate).getTime();
      return dateA - dateB;
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
      { header: 'Loan ID', key: 'loanId', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Loan Type', key: 'loanType', width: 20 },
      { header: 'Loan Date', key: 'loanDate', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'Loan Amount', key: 'loanAmount', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Maturity Date', key: 'maturityDate', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'Loan Term', key: 'loanTerm', width: 10 },
      { header: 'Interest', key: 'interest', width: 10, style: { numFmt: '0.00%' } },
      { header: 'Monthly Payment', key: 'monthlyPayment', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Total Payable', key: 'totalPayable', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Amount Paid', key: 'amountPaid', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Remaining Balance', key: 'remainingBalance', width: 20, style: { numFmt: '#,##0.00' } },
      { header: 'Loan Status', key: 'status', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };

    sortedLoans.forEach(loan => {
      const employee = loan.employee;
      const fullName = employee ? `${employee.lastName}, ${employee.firstName} ${employee.middleName || ''}`.trim() : 'N/A';
      const amountPaid = paymentsByLoanId[loan.loanId] || 0;
      const remainingBalance = loan.totalPayable - amountPaid;

      worksheet.addRow({
        fullName,
        branch: employee?.branch || 'N/A',
        loanType: loan.loanType ? loan.loanType.loanTypeName : 'N/A',
        loanId: loan.loanId,
        loanDate: loan.loanDate,
        loanAmount: loan.loanAmount,
        maturityDate: loan.maturityDate,
        loanTerm: loan.loanTerm,
        interest: loan.interest / 100,
        monthlyPayment: loan.monthlyPayment,
        totalPayable: loan.totalPayable,
        amountPaid,
        remainingBalance,
        status: loan.status || 'N/A',
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

    const members = await Member.find({}).sort({ branch: 1, lastName: 1, firstName: 1 });

    const workbook = new excel.Workbook();

    const sanitizeSheetName = (name) => {
      const sanitized = (name || 'Branch').replace(/[\\\/*?:\[\]]/g, '_').trim();
      return sanitized.substring(0, 31) || 'Branch';
    };

    const sheetNameCounts = {};

    const getUniqueSheetName = (branchName) => {
      let sheetName = sanitizeSheetName(branchName);
      if (!sheetNameCounts[sheetName]) {
        sheetNameCounts[sheetName] = 1;
        return sheetName;
      }
      sheetNameCounts[sheetName] += 1;
      const suffix = ` (${sheetNameCounts[sheetName]})`;
      return sheetName.substring(0, 31 - suffix.length) + suffix;
    };

    const membersByBranch = members.reduce((acc, member) => {
      const branch = member.branch || 'Unassigned';
      if (!acc[branch]) acc[branch] = [];
      acc[branch].push(member);
      return acc;
    }, {});

    const branchNames = Object.keys(membersByBranch).sort((a, b) => a.localeCompare(b));

    branchNames.forEach(branch => {
      const worksheetName = getUniqueSheetName(branch);
      const worksheet = workbook.addWorksheet(worksheetName);

      worksheet.columns = [
        { header: 'Employee ID', key: 'employeeId', width: 15 },
        { header: 'Full Name', key: 'fullName', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone Number', key: 'phoneNumber', width: 20 },
        { header: 'Address', key: 'address', width: 40 },
        { header: 'Employment Date', key: 'dateOfJoining', width: 20, style: { numFmt: 'yyyy-mm-dd' } },
        { header: 'Membership Status', key: 'membershipStatus', width: 20 },
      ];

      worksheet.getRow(1).font = { bold: true };

      membersByBranch[branch].forEach(member => {
        const fullName = `${member.lastName}, ${member.firstName} ${member.middleName || ''}`.trim();

        worksheet.addRow({
          employeeId: member.employeeId,
          fullName,
          email: member.email,
          phoneNumber: member.phoneNumber,
          address: member.address,
          dateOfJoining: member.dateOfJoining,
          membershipStatus: member.membershipStatus,
        });
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Member_Report_By_Branch.xlsx'
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

    const payments = await Payment.find({ loanId: { $exists: true, $ne: null } })
      .populate({
        path: 'member',
        model: 'Member',
        select: 'employeeId firstName lastName middleName branch'
      })
      .populate({
        path: 'loan',
        select: 'loanId loanType',
        populate: {
          path: 'loanType',
          model: 'LoanType',
          foreignField: 'loanTypeCode',
          localField: 'loanType',
          select: 'loanTypeName'
        }
      });

    // Sort payments by branch, then last name, then first name, then payment date
    const sortedPayments = payments.sort((a, b) => {
      const branchA = a.member?.branch || 'ZZZ';
      const branchB = b.member?.branch || 'ZZZ';

      // First compare by branch
      const branchCompare = branchA.localeCompare(branchB);
      if (branchCompare !== 0) return branchCompare;

      // Then compare by last name
      const lastNameA = a.member?.lastName || '';
      const lastNameB = b.member?.lastName || '';
      const lastNameCompare = lastNameA.localeCompare(lastNameB);
      if (lastNameCompare !== 0) return lastNameCompare;

      // Then compare by first name
      const firstNameA = a.member?.firstName || '';
      const firstNameB = b.member?.firstName || '';
      const firstNameCompare = firstNameA.localeCompare(firstNameB);
      if (firstNameCompare !== 0) return firstNameCompare;

      // Finally compare by payment date (oldest first)
      const dateA = new Date(a.paymentDate).getTime();
      const dateB = new Date(b.paymentDate).getTime();
      return dateA - dateB;
    });

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Payment Report');

    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Amount Paid', key: 'amountPaid', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Interest Rebate', key: 'interestRebate', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Loan ID', key: 'loanId', width: 15 },
      { header: 'Loan Type', key: 'loanType', width: 20 },
      { header: 'Payment Date', key: 'paymentDate', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    worksheet.getRow(1).font = { bold: true };

    sortedPayments.forEach(payment => {
      const member = payment.member;
      if (member) {
        const fullName = `${member.lastName}, ${member.firstName} ${member.middleName || ''}`.trim();
        worksheet.addRow({
          employeeId: member.employeeId,
          fullName: fullName,
          branch: member.branch || 'N/A',
          loanId: payment.loan?.loanId || 'N/A',
          loanType: payment.loan?.loanType?.loanTypeName || 'N/A',
          paymentDate: payment.paymentDate,
          amountPaid: payment.amountPaid,
          interestRebate: payment.interestRebate,
          notes: payment.notes || '',
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

    const contributions = await Payment.find({ paymentType: 'Contribution' })
      .populate({
        path: 'employee',
        model: 'Member',
        select: 'employeeId firstName lastName middleName branch'
      })
      .sort({ 'branch': 1 });

    // Sort contributions by branch, then alphabetically by last name
    const sortedContributions = contributions.sort((a, b) => {
      const branchA = a.employee?.branch || 'ZZZ'; // Put members without branch at the end
      const branchB = b.employee?.branch || 'ZZZ';

      // First compare by branch
      const branchCompare = branchA.localeCompare(branchB);
      if (branchCompare !== 0) return branchCompare;

      // Then compare by last name
      const lastNameA = a.employee?.lastName || '';
      const lastNameB = b.employee?.lastName || '';
      const lastNameCompare = lastNameA.localeCompare(lastNameB);
      if (lastNameCompare !== 0) return lastNameCompare;

      // Then compare by first name
      const firstNameA = a.employee?.firstName || '';
      const firstNameB = b.employee?.firstName || '';
      const firstNameCompare = firstNameA.localeCompare(firstNameB);
      if (firstNameCompare !== 0) return firstNameCompare;

      // Finally compare by payment date (oldest first)
      const dateA = new Date(a.paymentDate).getTime();
      const dateB = new Date(b.paymentDate).getTime();
      return dateA - dateB;
    });

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

    sortedContributions.forEach(item => {
      if (item.employee && typeof item.employee === 'object') {
        const member = item.employee;
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

exports.generateScheduleOfAccounts = async (req, res) => {
  try {
    await connectDB();

    const { startYear, endYear, format } = req.body;
    const outputFormat = (req.query.format || format || 'excel').toString().toLowerCase();

    if (!startYear || !endYear) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'startYear and endYear are required in the request body'
      });
    }

    if (isNaN(startYear) || isNaN(endYear)) {
      return res.status(400).json({
        error: 'Invalid year format',
        message: 'startYear and endYear must be valid numbers'
      });
    }

    const start = parseInt(startYear, 10);
    const end = parseInt(endYear, 10);

    if (start > end) {
      return res.status(400).json({
        error: 'Invalid year range',
        message: 'startYear must be less than or equal to endYear'
      });
    }

    const members = await Member.find({});
    const contributionPayments = await Payment.find({ paymentType: 'Contribution' });
    const payments = await Payment.find({});

    const yearKeys = [];
    for (let year = start; year <= end; year += 1) {
      yearKeys.push(`year${year}`);
    }

    const contributionsByEmployee = {};
    contributionPayments.forEach(contribution => {
      if (!contribution.employeeId) return;
      const employeeId = contribution.employeeId;
      if (!contributionsByEmployee[employeeId]) {
        const emp = {};
        yearKeys.forEach(key => { emp[key] = 0; });
        contributionsByEmployee[employeeId] = emp;
      }
      const year = new Date(contribution.paymentDate).getFullYear();
      const yearKey = `year${year}`;
      if (year >= start && year <= end) {
        contributionsByEmployee[employeeId][yearKey] += contribution.amountPaid || 0;
      }
    });

    const interestByEmployee = {};
    payments.forEach(payment => {
      if (!payment.employeeId) return;
      const employeeId = payment.employeeId;
      if (!interestByEmployee[employeeId]) {
        interestByEmployee[employeeId] = {
          interestOnCapital: 0,
          patronage: 0
        };
      }
      interestByEmployee[employeeId].interestOnCapital += payment.interestRebate || 0;
    });

    const dataByBranch = {};
    const totalsByBranch = {};

    members.forEach(member => {
      const branch = member.branch || 'N/A';
      const contributionsForMember = contributionsByEmployee[member.employeeId] || {};
      const interest = interestByEmployee[member.employeeId] || { interestOnCapital: 0, patronage: 0 };

      let totalShare = 0;
      yearKeys.forEach(yearKey => {
        totalShare += contributionsForMember[yearKey] || 0;
      });

      const interestOnCapital = interest.interestOnCapital;
      const patronage = interest.patronage;
      const amount = interestOnCapital + patronage;

      if (!dataByBranch[branch]) {
        dataByBranch[branch] = [];
        totalsByBranch[branch] = {
          totalShare: 0,
          interestOnCapital: 0,
          patronage: 0,
          amount: 0
        };
        yearKeys.forEach(key => { totalsByBranch[branch][key] = 0; });
      }

      const memberData = {
        branch,
        name: `${member.lastName}, ${member.firstName} ${member.middleName || ''}`.trim(),
        totalShare,
        interestOnCapital,
        patronage,
        amount
      };

      yearKeys.forEach(yearKey => {
        memberData[yearKey] = contributionsForMember[yearKey] || 0;
      });

      dataByBranch[branch].push(memberData);

      yearKeys.forEach(key => {
        totalsByBranch[branch][key] += memberData[key];
      });
      totalsByBranch[branch].totalShare += totalShare;
      totalsByBranch[branch].interestOnCapital += interestOnCapital;
      totalsByBranch[branch].patronage += patronage;
      totalsByBranch[branch].amount += amount;
    });

    const branches = Object.keys(dataByBranch).sort();
    const documentDate = new Date(end, 11, 31).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fileDate = new Date().toISOString().split('T')[0];

    const sanitizeSheetName = (name) => {
      const safe = (name || 'Branch').replace(/[\\\/*?:\[\]]/g, '_').trim();
      return safe.substring(0, 31) || 'Branch';
    };

    if (outputFormat === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40, bufferPages: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Schedule_of_Accounts_${fileDate}.pdf`);
      doc.pipe(res);

      const renderHeader = (title, branchName) => {
        doc.y = doc.page.margins.top;
        doc.font('Helvetica-Bold').fontSize(14).text('ACE NBS INCOME GENERATING PROGRAM', { align: 'center' });
        doc.moveDown(0.2);
        doc.fontSize(12).text('SCHEDULE OF ACCOUNTS', { align: 'center' });
        doc.moveDown(0.2);
        doc.font('Helvetica').fontSize(10).text(`Share Capital & Capital Build-up as of ${documentDate}`, { align: 'center' });
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(11).text(`BRANCH    ${branchName}`, doc.page.margins.left, doc.y, { align: 'left' });
        doc.moveDown(0.5);
      };

      const startNewPage = (branchName, firstPage = false) => {
        if (!firstPage) {
          doc.addPage();
        }
        renderHeader('ACE NBS INCOME GENERATING PROGRAM - SCHEDULE OF ACCOUNTS', branchName);
      };

      const pageBottom = doc.page.height - doc.page.margins.bottom - 20;
      const lineHeight = 14;
      const rowHeight = 18;
      const availableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const nameWidth = 120;
      const columnCount = yearKeys.length + 4;
      const remainingWidth = availableWidth - nameWidth;
      const otherWidth = remainingWidth / columnCount;
      const columnWidths = [nameWidth, ...Array(columnCount).fill(otherWidth)];

      const renderTableRow = (values, bold = false, fill = false) => {
        const y = doc.y;
        let x = doc.page.margins.left;
        doc.lineWidth(0.5).strokeColor('black');
        values.forEach((value, index) => {
          const width = columnWidths[index] || otherWidth;
          doc.rect(x, y, width, rowHeight).stroke();
          doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor('black');
          const align = index === 0 ? 'left' : 'right';
          const xOffset = index === 0 ? 4 : width - 4;
          doc.text(String(value), x + (index === 0 ? 4 : 2), y + 3, {
            width: width - 8,
            align: align,
            ellipsis: true,
            lineBreak: false
          });
          x += width;
        });
        doc.y = y + rowHeight;
      };

      const renderTableHeader = () => {
        const shareCapitalLabel = yearKeys.length > 0 ? `SHARE\nCAPITAL ${yearKeys[0].replace('year', '')}` : 'SHARE\nCAPITAL';
        const capitalBuildLabel = yearKeys.length > 1 ? `CAPITAL\nBUILD UP ${yearKeys[yearKeys.length - 1].replace('year', '')}` : 'CAPITAL\nBUILD UP';
        const totalShareLabel = `TOTAL\nSHARE ${end}`;

        const headers = [
          'NAME',
          shareCapitalLabel,
          capitalBuildLabel,
          totalShareLabel,
          'INTEREST\nON CAPITAL',
          'PATRONAGE\nCASH/APPL',
          'AMOUNT'
        ];

        const y = doc.y;
        let x = doc.page.margins.left;

        headers.forEach((header, index) => {
          const width = columnWidths[index] || otherWidth;
          doc.rect(x, y, width, rowHeight * 1.5).stroke();
          doc.font('Helvetica-Bold').fontSize(7).fillColor('black');
          const lines = header.split('\n');
          const lineSpacing = 8;
          const startY = y + (rowHeight * 1.5 - lines.length * lineSpacing) / 2;

          lines.forEach((line, lineIndex) => {
            doc.text(line, x + 2, startY + lineIndex * lineSpacing, {
              width: width - 4,
              align: 'center',
              lineBreak: false
            });
          });
          x += width;
        });
        doc.y = y + rowHeight * 1.5;
      };

      const ensureSpace = () => {
        if (doc.y + rowHeight * 3 > pageBottom) {
          doc.addPage();
          renderTableHeader();
        }
      };

      branches.forEach((branch, branchIndex) => {
        startNewPage(branch.toUpperCase(), branchIndex === 0);
        renderTableHeader();

        const membersInBranch = dataByBranch[branch].sort((a, b) => a.name.localeCompare(b.name));

        membersInBranch.forEach(member => {
          ensureSpace();
          const shareCapital = yearKeys.length > 0 ? (member[yearKeys[0]] || 0).toFixed(2) : '0.00';
          const capitalBuild = yearKeys.length > 1 ? (member[yearKeys[yearKeys.length - 1]] || 0).toFixed(2) : '0.00';

          const rowValues = [
            member.name,
            shareCapital,
            capitalBuild,
            member.totalShare.toFixed(2),
            member.interestOnCapital.toFixed(2),
            member.patronage.toFixed(2),
            member.amount.toFixed(2)
          ];
          renderTableRow(rowValues);
        });

        ensureSpace();
        const shareCapitalTotal = yearKeys.length > 0 ? totalsByBranch[branch][yearKeys[0]].toFixed(2) : '0.00';
        const capitalBuildTotal = yearKeys.length > 1 ? totalsByBranch[branch][yearKeys[yearKeys.length - 1]].toFixed(2) : '0.00';

        const subtotalValues = [
          'TOTAL',
          shareCapitalTotal,
          capitalBuildTotal,
          totalsByBranch[branch].totalShare.toFixed(2),
          totalsByBranch[branch].interestOnCapital.toFixed(2),
          totalsByBranch[branch].patronage.toFixed(2),
          totalsByBranch[branch].amount.toFixed(2)
        ];
        renderTableRow(subtotalValues, true);
        doc.moveDown(0.5);
      });

      doc.end();
      return;
    }

    // Excel format
    const workbook = new excel.Workbook();
    const sheetNameCounts = {};

    const createBranchWorksheet = (branchName) => {
      const baseName = sanitizeSheetName(branchName);
      const count = sheetNameCounts[baseName] || 0;
      sheetNameCounts[baseName] = count + 1;
      const sheetName = count === 0
        ? baseName
        : `${baseName.substring(0, 31 - (` (${count + 1})`.length))} (${count + 1})`;

      const worksheet = workbook.addWorksheet(sheetName);

      // Title
      worksheet.mergeCells('A1:G1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'ACE NBS INCOME GENERATING PROGRAM';
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center', vertical: 'center' };

      // Subtitle
      worksheet.mergeCells('A2:G2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = 'SCHEDULE OF ACCOUNTS';
      subtitleCell.font = { bold: true, size: 12 };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'center' };

      // Date
      worksheet.mergeCells('A3:G3');
      const dateCell = worksheet.getCell('A3');
      dateCell.value = `Share Capital & Capital Build-up as of ${documentDate}`;
      dateCell.font = { italic: true, size: 10 };
      dateCell.alignment = { horizontal: 'center' };

      worksheet.addRow([]);

      // Branch header
      const branchRow = worksheet.addRow([`BRANCH    ${branchName}`]);
      branchRow.font = { bold: true, size: 11 };
      worksheet.mergeCells(`A${branchRow.number}:G${branchRow.number}`);

      worksheet.addRow([]);

      const shareCapitalLabel = yearKeys.length > 0 ? `SHARE CAPITAL ${yearKeys[0].replace('year', '')}` : 'SHARE CAPITAL';
      const capitalBuildLabel = yearKeys.length > 1 ? `CAPITAL BUILD UP ${yearKeys[yearKeys.length - 1].replace('year', '')}` : 'CAPITAL BUILD UP';
      const totalShareLabel = `TOTAL SHARE ${end}`;

      const columns = [
        { header: 'NAME', key: 'name', width: 30 },
        { header: shareCapitalLabel, key: 'shareCapital', width: 18, style: { numFmt: '#,##0.00' } },
        { header: capitalBuildLabel, key: 'capitalBuild', width: 18, style: { numFmt: '#,##0.00' } },
        { header: totalShareLabel, key: 'totalShare', width: 18, style: { numFmt: '#,##0.00' } },
        { header: 'INTEREST ON CAPITAL', key: 'interestOnCapital', width: 18, style: { numFmt: '#,##0.00' } },
        { header: 'PATRONAGE CASH/APPL', key: 'patronage', width: 18, style: { numFmt: '#,##0.00' } },
        { header: 'AMOUNT', key: 'amount', width: 18, style: { numFmt: '#,##0.00' } }
      ];

      worksheet.columns = columns;

      // Style header row
      const headerRow = worksheet.getRow(worksheet.lastRow.number + 1);
      columns.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = col.header;
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      headerRow.height = 30;

      return worksheet;
    };

    branches.forEach(branch => {
      const worksheet = createBranchWorksheet(branch.toUpperCase());
      const membersInBranch = dataByBranch[branch].sort((a, b) => a.name.localeCompare(b.name));

      membersInBranch.forEach(member => {
        const shareCapital = yearKeys.length > 0 ? (member[yearKeys[0]] || 0) : 0;
        const capitalBuild = yearKeys.length > 1 ? (member[yearKeys[yearKeys.length - 1]] || 0) : 0;

        const row = worksheet.addRow({
          name: member.name,
          shareCapital: shareCapital,
          capitalBuild: capitalBuild,
          totalShare: member.totalShare,
          interestOnCapital: member.interestOnCapital,
          patronage: member.patronage,
          amount: member.amount
        });

        // Apply borders to all cells
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          // Right align numbers, left align name
          if (colNumber === 1) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        });
      });

      // Add total row
      const shareCapitalTotal = yearKeys.length > 0 ? totalsByBranch[branch][yearKeys[0]] : 0;
      const capitalBuildTotal = yearKeys.length > 1 ? totalsByBranch[branch][yearKeys[yearKeys.length - 1]] : 0;

      const totalRow = worksheet.addRow({
        name: 'TOTAL',
        shareCapital: shareCapitalTotal,
        capitalBuild: capitalBuildTotal,
        totalShare: totalsByBranch[branch].totalShare,
        interestOnCapital: totalsByBranch[branch].interestOnCapital,
        patronage: totalsByBranch[branch].patronage,
        amount: totalsByBranch[branch].amount
      });

      // Style total row
      totalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        if (colNumber === 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Schedule_of_Accounts_${fileDate}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('GenerateScheduleOfAccounts error:', err);
    res.status(500).json({ error: 'Failed to generate schedule of accounts', details: err.message });
  }
};