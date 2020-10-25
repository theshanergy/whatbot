require('dotenv').config()

const fs = require('fs')
const axios = require('axios')
const inquirer = require('inquirer')

const { Client } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')

// Set up session.
const SESSION_FILE_PATH = './session.json'
let sessionCfg
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH)
}

// Create array of selected contacts.
let selectedContacts = []

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
    console.error('AUTHENTICATION FAILURE', message)
})

// On client ready.
client.on('ready', async () => {
    console.log('Client is ready!')

    // Choose enabled contacts.
    chooseContacts()
})

// Prompt user to select active contacts.
const chooseContacts = () => {
    // Get list of current chat instances.
    client.getChats().then((chats) => {
        let contactChoices = []
        // Loop through chats and build choices array.
        chats.forEach((item, index) => {
            if (index <= 5) {
                contactChoices.push({ name: item.name, value: item.id._serialized })
            }
        })
        inquirer
            .prompt([
                {
                    type: 'checkbox',
                    name: 'contacts',
                    message: 'Select contacts',
                    choices: contactChoices,
                },
            ])
            .then(answers => {
                // Set selected contacts array.
                selectedContacts = answers.contacts
            })
            .catch(error => {
                console.error('PROMPT FAILURE', error)
            })

    })
}

// On message received.
client.on('message', async (message) => {

    // If AI is enabled for this contact.
    if (selectedContacts.includes(message.from)) {

        // Set my name.
        const myName = client.info.pushname

        // Get contact.
        const contact = await message.getContact()

        // Get contact name.
        const contactName = contact.shortName

        // Log message.
        console.log(contactName + ': ' + message.body)

        // Get Chat.
        const chat = await message.getChat()

        // Set up prompt.
        let prompt = "The following is a platonic conversation between " + myName + " and " + contactName + ". " + myName + " is a 33 year old man. He is helpful, creative, clever, and friendly.\n\n"

        // Pre-train via prompt.
        prompt += contactName + ": How are you?\n"
        prompt += myName + ": I'm good, how are you?\n"

        prompt += contactName + ": Good, what are you doing?\n"
        prompt += myName + ": Just working on my computer\n"

        prompt += contactName + ": Do you like me?\n"
        prompt += myName + ": Sure, I think you're a great friend.\n"

        prompt += contactName + ': How much does the earth weigh?\n'
        prompt += myName + ': The earth weighs 13,170,000,000,000,000,000,000,000 pounds\n'

        // Loop through last 10 messages of history.
        const history = await chat.fetchMessages({ limit: 6 })
        history.forEach(function (item, index) {
            // Get author name
            const name = item.from == message.from ? contactName : myName
            // Add to prompt.
            if (!prompt.includes(item.body)) {
                prompt += name + ': ' + item.body + '\n'
            }
        })

        // Finalize prompt.
        prompt += myName + ':'

        // Set typing state.
        chat.sendStateTyping()

        // Query GPT-3 API.
        axios
            .post('https://api.openai.com/v1/engines/davinci/completions', {
                prompt: prompt,
                temperature: 0.6,
                max_tokens: 100,
                top_p: 1,
                frequency_penalty: 0.5,
                presence_penalty: 0.6,
                stop: '\n',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + process.env.OPENAI_SECRET_KEY,
                },
            })
            .then((response) => {
                let responseText = response.data.choices[0].text.trim()
                // Send reply.
                client.sendMessage(message.from, responseText)
                // Log reply.
                console.log(myName + ': ', responseText)
            })
            .catch((error) => console.error('GPT-3 REQUEST FAILURE', error))

    }
})

// Initialize WhatsApp client.
client.initialize()