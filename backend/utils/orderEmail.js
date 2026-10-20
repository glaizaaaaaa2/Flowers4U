const sendEmail = require('./sendEmail')
const PDFDocument = require('pdfkit')
const { SHOP_NAME } = require('../config/shop')

const money = n => `PHP ${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'

const orderTable = order => `
  <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#eee;width:100%">
    <tr style="background:#f7b6c8"><th align="left">Item</th><th>Qty</th><th align="right">Price</th><th align="right">Subtotal</th></tr>
    ${order.orderItems.map(i => `<tr><td>${i.name}${i.size ? ` (${i.size})` : ''}</td><td align="center">${i.quantity}</td><td align="right">${money(i.price)}</td><td align="right">${money(i.price * i.quantity)}</td></tr>`).join('')}
  </table>
  <p>Items: ${money(order.itemsPrice)}<br/>Shipping: ${money(order.shippingPrice)}<br/>Tax: ${money(order.taxPrice)}<br/><b>Total: ${money(order.totalPrice)}</b></p>`

const details = order => `
  <p><b>Order #:</b> ${order._id}<br/>
  <b>Status:</b> ${order.orderStatus}<br/>
  <b>Delivery date:</b> ${fmtDate(order.deliveryDate)}<br/>
  <b>Recipient:</b> ${order.recipient && order.recipient.name}${order.recipient && order.recipient.phoneNo ? ` (${order.recipient.phoneNo})` : ''}<br/>
  <b>Address:</b> ${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.postalCode}, ${order.shippingInfo.country}</p>`

const createReceiptPdf = order => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks = []
    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const left = 50
    const right = 545
    const line = y => doc.moveTo(left, y).lineTo(right, y).strokeColor('#dddddd').stroke()
    const date = order.paidAt || order.createdAt
    const address = order.shippingInfo

    doc.fillColor('#2b4a39').font('Helvetica-Bold').fontSize(22).text(SHOP_NAME)
    doc.moveDown(0.35)
    doc.fontSize(16).text('OFFICIAL RECEIPT')
    doc.moveDown(0.35)
    doc.fillColor('#333333').font('Helvetica').fontSize(10)
        .text(`Order #: ${order._id}`)
        .text(`Transaction date: ${fmtDate(date)}`)
        .text(`Payment reference: ${(order.paymentInfo && order.paymentInfo.id) || '-'}`)
        .text(`Status: ${order.orderStatus}`)
    doc.moveDown()
    doc.font('Helvetica-Bold').fontSize(11).text('Delivery details')
    doc.font('Helvetica').fontSize(10)
        .text(`Recipient: ${(order.recipient && order.recipient.name) || '-'}`)
        .text(`Phone: ${(order.recipient && order.recipient.phoneNo) || address.phoneNo || '-'}`)
        .text(`Delivery date: ${fmtDate(order.deliveryDate)}`)
        .text(`Address: ${[address.address, address.city, address.postalCode, address.country].filter(Boolean).join(', ')}`)
    doc.moveDown()

    const drawTableHeader = () => {
        const y = doc.y
        doc.fillColor('#2b4a39').font('Helvetica-Bold').fontSize(9)
        doc.text('Item', left, y, { width: 260 })
        doc.text('Qty', 315, y, { width: 40, align: 'right' })
        doc.text('Price', 365, y, { width: 80, align: 'right' })
        doc.text('Subtotal', 455, y, { width: 90, align: 'right' })
        doc.moveDown(0.5)
        line(doc.y)
        doc.moveDown(0.5)
    }

    drawTableHeader()
    doc.font('Helvetica').fontSize(9).fillColor('#333333')
    for (const item of order.orderItems) {
        const itemName = `${item.name}${item.size ? ` (${item.size})` : ''}`
        const rowHeight = Math.max(18, doc.heightOfString(itemName, { width: 250 }))
        if (doc.y + rowHeight > doc.page.height - 100) {
            doc.addPage()
            drawTableHeader()
            doc.font('Helvetica').fontSize(9).fillColor('#333333')
        }
        const y = doc.y
        doc.text(itemName, left, y, { width: 250 })
        doc.text(String(item.quantity), 315, y, { width: 40, align: 'right' })
        doc.text(money(item.price), 365, y, { width: 80, align: 'right' })
        doc.text(money(item.price * item.quantity), 455, y, { width: 90, align: 'right' })
        doc.y = y + rowHeight + 6
    }

    line(doc.y)
    doc.moveDown(0.7)
    const totals = [
        ['Items', order.itemsPrice],
        ['Shipping', order.shippingPrice],
        ['Tax', order.taxPrice],
        ['Total paid', order.totalPrice]
    ]
    for (const [label, amount] of totals) {
        doc.font(label === 'Total paid' ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(label === 'Total paid' ? 12 : 10)
            .text(label, 330, doc.y, { width: 100 })
            .text(money(amount), 430, doc.y, { width: 115, align: 'right' })
        doc.moveDown(0.5)
    }

    doc.moveDown()
    doc.font('Helvetica').fontSize(10).fillColor('#555555').text('Thank you for shopping with us!')
    doc.end()
})

const receiptAttachment = async order => ({
    filename: `receipt-${order._id}.pdf`,
    content: await createReceiptPdf(order),
    contentType: 'application/pdf'
})

// Never let an email problem break the order flow
const safeSend = async (opts) => {
    try { await sendEmail(opts) } catch (e) { console.log('Email not sent:', e.message) }
}

exports.sendOrderPlaced = async (user, order) => {
    try {
        const attachment = await receiptAttachment(order)
        return await safeSend({
            email: user.email,
            subject: `${SHOP_NAME} - Order received (#${order._id})`,
            message: `Thank you for your order. Order #${order._id}. Total ${money(order.totalPrice)}. A PDF copy is attached.`,
            html: `<h2>Thank you for your order, ${user.name}!</h2>${details(order)}${orderTable(order)}<p>A downloadable PDF copy of your receipt is attached.</p>`,
            attachments: [attachment]
        })
    } catch (e) {
        console.log('Order receipt PDF not sent:', e.message)
    }
}

exports.sendStatusUpdate = (user, order) => safeSend({
    email: user.email,
    subject: `${SHOP_NAME} - Your order is now ${order.orderStatus}`,
    message: `Your order #${order._id} is now: ${order.orderStatus}.`,
    html: `<h2>Order update: ${order.orderStatus}</h2>${details(order)}${orderTable(order)}`
})

exports.sendReceipt = async (user, order) => {
    try {
        const attachment = await receiptAttachment(order)
        return await safeSend({
            email: user.email,
            subject: `${SHOP_NAME} - Receipt for order #${order._id}`,
            message: `Receipt for order #${order._id}. Total paid ${money(order.totalPrice)}. A PDF copy is attached.`,
            html: `<h2>${SHOP_NAME} - Official Receipt</h2><p>Transaction date: ${fmtDate(order.paidAt)}<br/>Payment ref: ${order.paymentInfo && order.paymentInfo.id}</p>${details(order)}${orderTable(order)}<p>A downloadable PDF receipt is attached to this email.</p><p>Thank you for shopping with us!</p>`,
            attachments: [attachment]
        })
    } catch (e) {
        console.log('Receipt PDF not sent:', e.message)
    }
}
