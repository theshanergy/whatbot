require('dotenv').config()

const fs = require('fs')
const axios = require('axios')

const { Client } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

// Set up session.
const SESSION_FILE_PATH = './session.json'
let sessionCfg
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH)
}

// Instantiate new WhatsApp client.
const client = new Client({ session: sessionCfg })

// On QR code.
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true })
})

// On authentication.
client.on('authenticated', (session) => {
    console.log('Authentication successful.')
    sessionCfg = session
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err)
        }
    })
})

// On auth failure.
client.on('auth_failure', message => {
    // Fired if session restore was unsuccessfull
    console.error('AUTHENTICATION FAILURE', message)
})

// On ready.
client.on('ready', () => {
    console.log('Client is ready!')


})


// On message.
client.on('message', async (message) => {

    // Get contact name.
    const contact = await message.getContact()
    const contactName = contact.shortName

    // Log message.
    console.log(contactName + ': ' + message.body)


    // Get Chat.
    const chat = await message.getChat()

    const history = await chat.fetchMessages({ limit: 10 })

    console.log(history)

    // Set up prompt.
    let prompt = "The following is a conversation with AI. He is helpful, creative, clever, and very friendly.\n\n"

    prompt += contactName + ": Hi, who are you?\n"
    prompt += "AI: I'm AI, how's it going?\n"

    prompt += contactName + ": " + message.body + "\n"
    prompt += "AI:"

    console.log(prompt)


    // List of contacts who will interact with the AI.
    let enabledContacts = [
        
        // 
        // 
    ]

    // If AI is enabled for this contact.
    if (enabledContacts.includes(message.from)) {

        // Set typing state.
        chat.sendStateTyping()


        // Query GPT-3 API
        axios
            .post('https://api.openai.com/v1/engines/davinci/completions', {
                prompt: prompt,
                temperature: 0.9,
                max_tokens: 100,
                top_p: 1,
                presence_penalty: 0.6,
                stop: '\n',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + process.env.OPENAI_SECRET_KEY,
                },
            })
            .then((response) => {
                // Send reply.
                client.sendMessage(message.from, response.data.choices[0].text)
                // Log reply.
                console.log('AI: ', response.data.choices[0].text)
            })
            .catch((error) => console.log('BAD', error))


    }
})

// Initialize WhatsApp client.
client.initialize()