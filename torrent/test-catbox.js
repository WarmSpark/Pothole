const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testCatbox() {
    try {
        console.log("Creating dummy file...");
        fs.writeFileSync('dummy.ts', 'hello catbox video chunk');

        console.log("Uploading to Catbox...");
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream('dummy.ts'));

        const upRes = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders()
        });
        
        const directLink = upRes.data;
        console.log("Upload Success! Direct Link:", directLink);

        console.log("Trying to fetch direct link...");
        const dlRes = await axios.get(directLink, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        console.log("Fetch Success! File contents:", dlRes.data);

    } catch (e) {
        console.error("Error:", e.response ? e.response.status : e.message);
    }
}
testCatbox();
