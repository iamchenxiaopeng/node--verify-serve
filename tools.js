// 生成uuid
function guuid() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
// 获取url参数
function getUrlParams(url) {
    let urlStr = url.split('?')[1]
    let obj = {}
    let paramsArr = urlStr.split('&')
    for (let i = 0, len = paramsArr.length; i < len; i++) {
        let arr = paramsArr[i].split('=')
        obj[arr[0]] = arr[1];
    }
    return obj
}
function saveData() {
    let userObj = new UserModel({
        name: '小明' + new Date().getTime(),
        age: 18,
        state: 'alive',
        hobby: 'computer'
    })
    userObj.save()
}
function saveCaptcha (code, uuid) {
    let captchaObj = new captchaModel({
        code: code,
        uuid: uuid,
        _id: new Date().getTime().toString()
    })
    return captchaObj.save()
}

module.exports = {
    guuid, getUrlParams, saveData, saveCaptcha
}