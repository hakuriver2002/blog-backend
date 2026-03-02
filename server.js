const app = require('./src/app');
const { port } = require('./src/config/env')


app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
})