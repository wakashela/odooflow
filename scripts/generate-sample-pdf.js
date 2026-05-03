#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactPDF = require('@react-pdf/renderer');
const { Document, Page, Text, View, Image, StyleSheet, pdf } = ReactPDF;

function getLogoSrc() {
  try {
    const localPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(localPath)) {
      const buff = fs.readFileSync(localPath);
      return `data:image/png;base64,${buff.toString('base64')}`;
    }
  } catch (e) {
    // ignore
  }
  const vercelHost = process.env.VERCEL_URL;
  if (vercelHost) {
    const host = vercelHost.startsWith('http') ? vercelHost : `https://${vercelHost}`;
    return `${host.replace(/\/$/, '')}/logo.png`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (site) return `${site.replace(/\/$/, '')}/logo.png`;
  return null;
}

const logoSrc = getLogoSrc();

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  logo: { width: 120, height: 42, objectFit: 'contain' },
  companyDetails: { flexDirection: 'column', justifyContent: 'space-between', height: 42 },
  companyName: { fontSize: 12, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  companyInfo: { fontSize: 8, color: '#616161' },
  docTypeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, alignSelf: 'flex-start', backgroundColor: '#0A9688' },
  docTypeLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#fff', textTransform: 'uppercase' },
  body: { marginTop: 20 },
});

const doc = React.createElement(
  Document,
  null,
  React.createElement(
    Page,
    { size: 'A4', style: styles.page },
    React.createElement(
      View,
      { style: styles.header },
      React.createElement(
        View,
        { style: styles.headerLeft },
        logoSrc ? React.createElement(Image, { src: logoSrc, style: styles.logo }) : null,
        React.createElement(
          View,
          { style: styles.companyDetails },
          React.createElement(Text, { style: styles.companyName }, 'Jensen Automations Technology Limited'),
          React.createElement(
            View,
            { style: styles.companyInfo },
            React.createElement(Text, null, 'TIN: 168-782-179 | VRN: 40-315066-K'),
            React.createElement(Text, null, '21493 Dar es salaam, TANZANIA'),
            React.createElement(Text, null, 'Tel: +255745205050 | info@jensenintl.com')
          )
        )
      ),
      React.createElement(View, { style: styles.docTypeBadge }, React.createElement(Text, { style: styles.docTypeLabel }, 'SAMPLE'))
    ),
    React.createElement(View, { style: styles.body }, React.createElement(Text, null, 'This is a sample PDF generated to verify header alignment.'))
  )
);

const outPath = path.join(process.cwd(), 'sample-pdf-output.pdf');

ReactPDF.render(doc, outPath)
  .then(() => {
    console.log('Wrote sample PDF to', outPath);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to generate PDF:', err);
    process.exit(1);
  });
