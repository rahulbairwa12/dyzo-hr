import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatDateWithMonthName } from '@/helper/helper';
import dyzoLogo from '@/assets/images/landing_page/dyzonamelogo.png';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 30,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 8,
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    marginBottom: 2,
    lineHeight: 2,
  },
  addressBox: {
    marginBottom: 20,
    lineHeight: 2,
  },
  queryText: {
    marginTop: 3,
    marginBottom: 3
  },
  twoColumnSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  column: {
    width: '48%',
    lineHeight: 2
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCol: {
    width: '12.5%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    padding: 3,
  },
  tableColWide: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    padding: 3,
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#888',
  },
});

const Invoice = ({ selectedRowData, isUserTransactionHistory }) => {
  // Get invoice data from the originalInvoice if available
  const invoiceData = selectedRowData?.originalInvoice || selectedRowData;
  
  // Get the GST rate (default to 18%)
  const gstRate = 0.18;
  
  // Calculate amounts based on invoice data
  // Parse the amount string if it has currency symbol
  const rawAmount = selectedRowData?.amount;
  const totalAmount = typeof rawAmount === 'string' && rawAmount.startsWith('₹') 
    ? parseFloat(rawAmount.substring(1)) 
    : Number(rawAmount);
    
  // Get user limit from line items if available, otherwise use default or existing value
  const userLimit = invoiceData?.line_items?.[0]?.quantity || 
                   selectedRowData?.team_size || 
                   selectedRowData?.Buyuserlimit || 
                   1;
                   
  // Calculate amount excluding GST
  const amountExclGst = (totalAmount / (1 + gstRate)).toFixed(2);
  const gstAmount = (totalAmount - amountExclGst).toFixed(2);
  
  // Calculate price per user
  const pricePerUser = (amountExclGst / userLimit).toFixed(2);
  
  // Get plan name from invoice data if available
  const planName = invoiceData?.line_items?.[0]?.name || 
                   selectedRowData?.payment_plan || 
                   "Standard Plan";

  // Storage data for non-user transaction history
  const sizeInGB = Number(selectedRowData?.sizeByInMb) / 1024; 
  const pricePerGB = amountExclGst / sizeInGB;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={styles.logo} src={dyzoLogo} />
          <View>
            <Text style={styles.title}>TAX INVOICE</Text>
            <Text style={styles.subtitle}>(Original for Recipient)</Text>
          </View>
        </View>

        <View style={styles.addressBox}>
          <Text style={styles.bold}>{invoiceData?.customer_details?.customer_name || selectedRowData?.employee_name}</Text>
          <Text>{invoiceData?.customer_details?.customer_email || selectedRowData?.employee_email}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.bold}>Paid</Text>
          <Text>Sold by PRP Webs</Text>
          <Text>GSTIN # 08AARFP6587C1ZO</Text>
          <Text>Invoice Date: {formatDateWithMonthName(invoiceData?.issued_at * 1000 || selectedRowData?.payment_date || selectedRowData?.created_at)}</Text>
          <Text>Total payable: {`INR ${totalAmount.toFixed(2)}`}</Text>
        </View>

        <Text style={styles.queryText}>For questions about your order, contact team@prpwebs.com</Text>

        <View style={styles.twoColumnSection}>
          <View style={styles.column}>
            <Text style={styles.bold}>Issued To</Text>
            <Text>{invoiceData?.customer_details?.customer_name || selectedRowData?.employee_name}</Text>
            <Text>{invoiceData?.customer_details?.customer_email || selectedRowData?.employee_email}</Text>
            <Text>Order ID: {invoiceData?.order_id || selectedRowData?.razorpay_order_id || "N/A"}</Text>
            <Text>Payment ID: {invoiceData?.payment_id || selectedRowData?.razorpay_payment_id || "N/A"}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.bold}>Sold by</Text>
            <Text>PRP Webs</Text>
            <Text>GSTIN # 08AARFP6587C1ZO</Text>
            <Text>Invoice Date: {formatDateWithMonthName(invoiceData?.issued_at * 1000 || selectedRowData?.payment_date || selectedRowData?.created_at)}</Text>
            <Text>Total payable: {`INR ${totalAmount.toFixed(2)}`}</Text>
          </View>
        </View>

        <Text style={styles.bold}>Invoice details</Text>

        {isUserTransactionHistory || true ? ( // Always use user transaction layout for now
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableColWide, styles.bold]}>Plan</Text>
              <Text style={[styles.tableCol, styles.bold]}>Price (Per Person)</Text>
              <Text style={[styles.tableCol, styles.bold]}>User Limit</Text>
              <Text style={[styles.tableCol, styles.bold]}>Amount (excl. GST)</Text>
              <Text style={[styles.tableCol, styles.bold]}>GST</Text>
              <Text style={[styles.tableCol, styles.bold]}>GST Amount</Text>
              <Text style={[styles.tableCol, styles.bold]}>Item Subtotal (incl. GST)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColWide}>{planName}</Text>
              <Text style={styles.tableCol}>{pricePerUser}</Text>
              <Text style={styles.tableCol}>{userLimit}</Text>
              <Text style={styles.tableCol}>{amountExclGst}</Text>
              <Text style={styles.tableCol}>18%</Text>
              <Text style={styles.tableCol}>{gstAmount}</Text>
              <Text style={styles.tableCol}>{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableColWide, styles.bold]}>Plan</Text>
              <Text style={[styles.tableCol, styles.bold]}>Price (Per GB)</Text>
              <Text style={[styles.tableCol, styles.bold]}>Storage (GB)</Text>
              <Text style={[styles.tableCol, styles.bold]}>Amount (excl. GST)</Text>
              <Text style={[styles.tableCol, styles.bold]}>GST</Text>
              <Text style={[styles.tableCol, styles.bold]}>GST Amount</Text>
              <Text style={[styles.tableCol, styles.bold]}>Item Subtotal (incl. GST)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColWide}>{planName}</Text>
              <Text style={styles.tableCol}>{pricePerGB.toFixed(2)}</Text>
              <Text style={styles.tableCol}>{sizeInGB.toFixed(2)}</Text>
              <Text style={styles.tableCol}>{amountExclGst}</Text>
              <Text style={styles.tableCol}>18%</Text>
              <Text style={styles.tableCol}>{gstAmount}</Text>
              <Text style={styles.tableCol}>{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <View style={styles.twoColumnSection}>
          <View style={styles.column}>
            <Text style={styles.bold}>Invoice Total</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.bold}>{`INR ${totalAmount.toFixed(2)}`}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Please note that this invoice is not a demand for payment{'\n'}
          Registered Office: PRP Webs{'\n'}
          Contact: https://www.prpwebs.com
        </Text>
      </Page>
    </Document>
  );
};

export default Invoice;
