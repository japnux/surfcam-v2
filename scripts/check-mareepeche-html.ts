async function checkHTML() {
  const url = 'https://mareespeche.com/fr/aquitaine/biarritz'
  
  console.log(`Fetching ${url}...\n`)
  
  const response = await fetch(url)
  const html = await response.text()
  
  // Find tide-related content
  const tideMatches = html.match(/.{0,100}(marée|tide|▲|▼|haute|basse).{0,100}/gi)
  
  if (tideMatches) {
    console.log('Found tide-related content:')
    tideMatches.slice(0, 20).forEach((match, i) => {
      console.log(`${i + 1}. ${match}`)
    })
  } else {
    console.log('No tide content found')
  }
  
  // Look for time patterns
  console.log('\n\nLooking for time patterns:')
  const timeMatches = html.match(/\d{1,2}:\d{2}.{0,50}/g)
  if (timeMatches) {
    timeMatches.slice(0, 10).forEach((match, i) => {
      console.log(`${i + 1}. ${match}`)
    })
  }
}

checkHTML()
