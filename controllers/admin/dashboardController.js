const Order = require('../../models/orderSchema'); 
const Product = require('../../models/ProductScheema'); 
const Category =  require("../../models/categorySchema")
const excel = require('exceljs'); 
const PDFDocument = require('pdfkit');



const loadDashboard = async (req, res) => {
    if (req.session.admin) {
        try {
            const { filterType, startDate, endDate, status } = req.query;
            const query = {};
            const now = new Date();
            req.session.filterType = filterType
            req.session.startDate = startDate
            req.session.endDate = endDate
            req.session.status =status

            if (filterType){
                switch (filterType) {
                    case 'daily':
                        query.createdOn = {
                            $gte: new Date(now.setHours(0, 0, 0, 0)), 
                            $lte: new Date(now.setHours(23, 59, 59, 999)) 
                        };
                        break;
                    case 'weekly':
                        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                        query.createdOn = {
                            $gte: new Date(startOfWeek.setHours(0, 0, 0, 0)),
                            $lte: new Date()
                        };
                        break;
                    case 'monthly':
                        query.createdOn = {
                            $gte: new Date(now.getFullYear(), now.getMonth(), 1), 
                            $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) 
                        };
                        break;
                    case 'yearly':
                        query.createdOn = {
                            $gte: new Date(now.getFullYear(), 0, 1),
                            $lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
                        };
                        break;
                    case 'custom':
                        if (startDate && endDate) {
                            query.createdOn = {
                                $gte: new Date(startDate),
                                $lte: new Date(endDate)
                            };
                        }
                        break;
                    default:
                        break;
                }
            }
            if (status) {
                query.status = status;
            }
            const orders = await Order.find(query).populate('userId');
            const count = await Order.countDocuments();


             // total Amount sum //
            const totalAmountSum = await Order.aggregate([
                {
                  $group: {
                    _id: null, 
                    totalAmount: { $sum: "$finalAmount"  }
                  }
                }
              ]);
              const totalAmount = totalAmountSum.length > 0 ? totalAmountSum[0].totalAmount : 0;

              
               // best selling  10 product //
              const bestSellingProduct = await Order.aggregate([
                { $unwind: "$orderedItem" }, 
                {
                  $group: {
                    _id: "$orderedItem.product", 
                    totalQuantity: { $sum: "$orderedItem.quantity" }, 
                  },
                },
                { $sort: { totalQuantity: -1 } }, 
                { $limit: 10 }, 
              ]);
              const bestProductIds = bestSellingProduct.map(product => product._id);


              const best10Products = await Product.find({ _id: { $in: bestProductIds } });

              const top10Products = best10Products.map(product => {
                const salesData = bestSellingProduct.find(sale => sale._id.equals(product._id));
                return { ...product.toObject(), totalQuantity: salesData.totalQuantity };
              });
              


              
            //   list of the best brand //
              const topBrands = await Order.aggregate([
                { $unwind: "$orderedItem" }, 
                {
                  $lookup: {
                    from: "products",
                    localField: "orderedItem.product",
                    foreignField: "_id",
                    as: "productDetails",
                  },
                },
                { $unwind: "$productDetails" }, 
                {
                  $group: {
                    _id: "$productDetails.brand",
                    totalQuantity: { $sum: "$orderedItem.quantity" },
                  },
                },
                { $sort: { totalQuantity: -1 } }, 
                { $limit: 10 }, 
              ]);
              

             const discount = await Order.aggregate([
                { $match: { orderStatus: "Delivered" } },
                { $group: { _id: null, totalDiscount: { $sum: "$discount" } } }
                ]);

                const totalDiscount = discount.length > 0 ? discount[0].totalDiscount : 0;

             

              const topBrandIds = topBrands.map(brand => brand._id);
              const top10Brands = await Category.find({ _id: { $in: topBrandIds } });
          
              const top10BrandList = top10Brands.map(brand => {
                const brandSalesData = topBrands.find(b => b._id.equals(brand._id));
                return {
                  name: brand.name,
                  totalQuantity: brandSalesData ? brandSalesData.totalQuantity : 0,
                };
              });



            const orderCounts = {}; 
            orders.forEach(order => {
                const date = new Date(order.createdOn).toLocaleDateString();
                orderCounts[date] = (orderCounts[date] || 0) + 1;
            });
            if (Object.keys(orderCounts).length === 0) {
                const today = new Date();
                const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
                orderCounts[formattedDate] = 0;
            }     
            const chartLabels = Object.keys(orderCounts);
            const chartValues = Object.values(orderCounts);

            res.render('admin/dashboard', {
                discount,
                count,
                top10Products,
                top10BrandList ,
                totalAmount,
                orders,
                discount: [{ totalDiscount }],
                startDate: startDate || '',
                endDate: endDate || '',
                selectedStatus: status || '',
                filterType: filterType || 'daily' ,
                chartLabels: JSON.stringify(chartLabels), 
                chartValues: JSON.stringify(chartValues)  
            });
        } catch (error) {
            console.log('Error loading dashboard:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/admin/login');
    }
};

const downloadSalesReportPdf = async (req, res) => {
    try {
        const filterType = req.session.filterType
        const startDate  = req.session.startDate
        const endDate = req.session.endDate
        const status = req.session.status
        const query = {};
        const now = new Date();
        if (filterType) {
            switch (filterType) {
                case 'daily':
                    query.createdOn = {
                        $gte: new Date(now.setHours(0, 0, 0, 0)),
                        $lte: new Date(now.setHours(23, 59, 59, 999))
                    };
                    break;
                case 'weekly':
                    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                    query.createdOn = {
                        $gte: new Date(startOfWeek.setHours(0, 0, 0, 0)),
                        $lte: new Date()
                    };
                    break;
                case 'monthly':
                    query.createdOn = {
                        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
                    };
                    break;
                case 'yearly':
                    query.createdOn = {
                        $gte: new Date(now.getFullYear(), 0, 1),
                        $lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
                    };
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        query.createdOn = {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        };
                    }
                    break;
                default:
                    break;
            }
        }
        if (status) {
            query.status = status;
        }
        const orders = await Order.find(query).populate('userId');
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
        doc.pipe(res);
        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown(0.5);
        if (filterType) {
            doc.fontSize(12).text(`Filter: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`, { align: 'left' });
            if (filterType === 'custom') {
                doc.text(`From: ${new Date(startDate).toLocaleDateString()} To: ${new Date(endDate).toLocaleDateString()}`, { align: 'left' });
            }
        }
        doc.moveDown(1).fontSize(15).text('', { underline: true }).moveDown(0.5)

        if (status) {
            doc.text(`Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`, { align: 'left' });
        }

        doc.moveDown(0.4);
        doc.fontSize(12)
        doc.moveDown(0.4);

        const startX = 30;
        const colWidths = [100, 150, 100, 100];
        const headers = ['User', 'Amount', 'Status', 'Date'];
        doc.moveDown(1).fontSize(15).text('', { underline: true }).moveDown(0.5)

        // Draw table headers
        let xOffset = startX + 4;
        headers.forEach((header, index) => {
            doc.text(header, xOffset, doc.y - 12, { width: colWidths[index], align: 'center' });
            xOffset += colWidths[index];
        });
        doc.moveDown(1);
        orders.forEach(order => {
            xOffset = startX + 4;
            doc.text(order.userId.name, xOffset, doc.y - 12, { width: colWidths[0], align: 'center' });
            xOffset += colWidths[0];
            doc.text(`${order.finalAmount.toFixed(2)}`, xOffset, doc.y - 13, { width: colWidths[1], align: 'center' });
            xOffset += colWidths[1];
            doc.text(order.status.charAt(0).toUpperCase() + order.status.slice(1), xOffset, doc.y - 15, { width: colWidths[2], align: 'center' });
            xOffset += colWidths[2];
            doc.text(new Date(order.createdOn).toLocaleDateString(), xOffset, doc.y - 15, { width: colWidths[3], align: 'center' });
            doc.moveDown(0.8);
        });
        doc.moveDown(1).fontSize(15).text('', { underline: true }).moveDown(0.5)
        const totalAmount = orders.reduce((acc, order) => acc + order.finalAmount, 0).toFixed(2);
        doc.fontSize(12).text(`Total Amount: ${totalAmount}`, { align: 'right' });
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Internal Server Error');
    }
};




const downloadSalesReportExcel = async (req, res) => {
    try {
        const { filterType, startDate, endDate, status } = req.query;
        const query = {};

  if (filterType) {
            switch (filterType) {
                case 'daily':
                    query.createdOn = {
                        $gte: new Date(now.setHours(0, 0, 0, 0)),
                        $lte: new Date(now.setHours(23, 59, 59, 999))
                    };
                    break;
                case 'weekly':
                    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                    query.createdOn = {
                        $gte: new Date(startOfWeek.setHours(0, 0, 0, 0)),
                        $lte: new Date()
                    };
                    break;
                case 'monthly':
                    query.createdOn = {
                        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
                    };
                    break;
                case 'yearly':
                    query.createdOn = {
                        $gte: new Date(now.getFullYear(), 0, 1),
                        $lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
                    };
                    break;
                case 'custom':
                    if (startDate && endDate) {
                        query.createdOn = {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        };
                    }
                    break;
                default:
                    break;
            }
        }
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query).populate('userId')
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'User', key: 'userId', width: 30 },
            { header: 'Final Amount', key: 'finalAmount', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Date', key: 'createdOn', width: 20 }
        ];

        orders.forEach(order => {
            worksheet.addRow({
                userId: order.userId.name,
                finalAmount: order.finalAmount.toFixed(2),
                status: order.status,
                createdOn: new Date(order.createdOn).toLocaleDateString()
            });
        });

        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).send('Internal Server Error');
    }
};


module.exports = {
    downloadSalesReportPdf,
    downloadSalesReportExcel,
    loadDashboard
};