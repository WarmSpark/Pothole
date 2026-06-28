const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testLitterbox() {
    try {
        console.log("Creating dummy file...");
        fs.writeFileSync('dummy.ts', 'hello litterbox video chunk');

        console.log("Uploading to Litterbox (12 hour expiry)...");
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('time', '12h'); // Expires in 12 hours
        form.append('fileToUpload', fs.createReadStream('dummy.ts'));

        const upRes = await axios.post('https://litterbox.catbox.moe/api.php', form, {
            headers: form.getHeaders()
        });
        
        const directLink = upRes.data;
        console.log("Upload Success! Direct Link:", directLink);

        console.log("Trying to fetch direct link WITHOUT headers (simulating <video src>)...");
        const dlRes = await axios.get(directLink, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        console.log("Fetch Success! File contents:", dlRes.data);

    } catch (e) {
        console.error("Error:", e.message);
    }
}
testLitterbox();
