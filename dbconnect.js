const mongoose = require('mongoose');

const dbName = 'test'
const port = '27017'
const host = '114.115.137.244'

const mongoConnect = async () => {
    await mongoose.connect(`mongodb://${host}:${port}/`, { dbName: `${dbName}`,useNewUrlParser: true })
    .then(() => {
        console.log('数据库连接成功')
    })
    .catch(err => {
        console.log('数据库连接失败', err)
    })
}
mongoConnect()
module.exports = mongoose