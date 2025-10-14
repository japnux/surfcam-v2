async function testParsing() {
  const url = 'https://mareespeche.com/fr/aquitaine/biarritz'
  
  console.log(`Fetching ${url}...\n`)
  
  const response = await fetch(url)
  const html = await response.text()
  
  // Test the descriptive pattern
  console.log('Testing descriptive pattern:')
  const tideDescPattern = /marée\s+(haute|basse)[^à]+à\s+(\d{1,2}):(\d{2})\s*(?:am|pm)?/gi
  let match
  
  while ((match = tideDescPattern.exec(html)) !== null) {
    console.log(`  Found: ${match[1]} at ${match[2]}:${match[3]}`)
    console.log(`  Full match: ${match[0]}`)
  }
  
  console.log('\n\nSearching for "11:22" in HTML:')
  if (html.includes('11:22')) {
    console.log('  ✅ Found 11:22 in HTML')
    const context = html.match(/.{0,100}11:22.{0,100}/g)
    if (context) {
      context.slice(0, 3).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c}`)
      })
    }
  } else {
    console.log('  ❌ 11:22 not found in HTML')
  }
}

testParsing()
