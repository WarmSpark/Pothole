const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testGofile() {
    try {
        console.log("Creating guest account...");
        const accRes = await axios.post('https://api.gofile.io/accounts', {}, {
            headers: { 'Content-Type': 'application/json' }
        });
        const token = accRes.data.data.token;

        console.log("Getting server...");
        const srvRes = await axios.get('https://api.gofile.io/servers');
        const server = srvRes.data.data.servers[0].name;

        console.log("Creating dummy file...");
        fs.writeFileSync('dummy.mp4', 'dummy video content');

        console.log("Uploading...");
        const form = new FormData();
        form.append('file', fs.createReadStream('dummy.mp4'));
        form.append('token', token);

        const upRes = await axios.post(`https://${server}.gofile.io/contents/uploadfile`, form, {
            headers: form.getHeaders()
        });
        
        const folderId = upRes.data.data.parentFolder;
        const fileId = upRes.data.data.id;
        console.log("Folder ID:", folderId);
        console.log("File ID:", fileId);

        // Fetch the FOLDER to get the direct link
        console.log("Fetching folder contents...");
        const infoRes = await axios.get(`https://api.gofile.io/contents/${folderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const directLink = infoRes.data.data.children[fileId].link;
        console.log("Direct Link:", directLink);

        console.log("Trying to fetch direct link...");
        try {
            const dlRes = await axios.get(directLink, {
                headers: {
                    'Cookie': `accountToken=${token}`
                }
            });
            console.log("Success! File fetched.");
        } catch (e) {
            console.log("Failed to fetch direct link! Status:", e.response ? e.response.status : e.message);
        }
    } catch (e) {
        console.error(e.message);
    }
}
testGofile();
