const Koa = require('koa');
const Router = require('koa-router');
const glob = require('glob');
const logger = require('koa-logger');
const { resolve } = require('path');
const fs = require('fs');
const mongoose = require('./dbconnect');
// 生成svg验证码
const svgCaptcha = require('svg-captcha');
// 生成图片验证码
const { Captcha } = require('captcha-canvas');

const { guuid, getUrlParams } = require('./tools')

// 跨域
const cors = require('koa2-cors');
// 请求body解析
const parser = require('koa-bodyparser')

const app = new Koa();
const apiRouter = new Router({ prefix: '/api' });
const router = new Router();
const routerMap = {};


app.use(logger());
app.use(parser())
const captchaSchema = mongoose.Schema({
    code: String,
    _id: String,
    uuid: String
})
let captchaModel = mongoose.model('Captcha', captchaSchema)
function findData(data = {}) {
    return captchaModel.find(data)
}
function saveCaptcha (code, uuid) {
    let captchaObj = new captchaModel({
        code: code,
        uuid: uuid,
        _id: new Date().getTime().toString()
    })
    return captchaObj.save()
}

glob.sync(resolve('./api', '**/*.json')).forEach((item, i) => {
    let apiJsonPath = item && item.split('/api')[i];
    let apiPath = apiJsonPath.replace('.json', '');
    // 记录本地路由
    routerMap[apiJsonPath] = apiPath;
})

apiRouter.get('/fhbgsj', (ctx, next) => {

    let url = ctx.request.url
    try {
        ctx.body = {
            datas: {},
            state: 200,
            success: true
        }
    } catch (err) {
        ctx.throw(`服务器错误：${err}`, 500)
    }


})

/**
 * 生成svg格式验证码，有三种类型
 * width: number svg宽度
 * height: number svg高度
 * type: 1 | 2 | 3 验证码类型 1 普通字符串验证码；2 数字计算类型验证码；3 自定义字符串（需要传入text）
 * size: number 验证码字符串长度
 * color: boolean 是否显示不同颜色
 * background: string 背景颜色
 * text: string 自定义svg文字 
 */
router.post('/captchasvg', async (ctx, next) => {
    const req = ctx.request.body
    let options = {
        width: 200,
        height: 50,
        size: 6,
        color: true,
        noise: 4,
        background: 'white',
        mathMin: 1,
        mathMax: 9
    }
    Object.assign(options, req)
    // 生成随机的svg验证码
    const createStr = () => {
        return svgCaptcha.create(options)
    }
    // 生成带运算的svg验证码
    const createMathExpr = () => {
        return svgCaptcha.createMathExpr(options)
    }
    const svgCaptchaStr = (str = 'helloworld') => {
        // 将自定义字符串生成svg验证码
        return svgCaptcha(str, options)
    }
    let bodyData = {
        datas: {},
        state: 200,
        msg: '验证码获取成功',
        success: true
    }
    let findDatas = await findData({})
    if (req.type == 1 || req.type == undefined) {
        bodyData.datas = createStr()
    } else if (req.type == 2) {
        options.mathOperator = Math.random() > 0.5 ? '+' : '-'
        bodyData.datas = createMathExpr()
    } else if (req.type == 3) {

        if (!req.text) {
            bodyData = {
                datas: null,
                state: 200,
                msg: '验证码获取失败，请传入要转换的字符串',
                success: false
            }
        }
        bodyData.datas.data = svgCaptchaStr(req.text)
    }
    let captchaUuid = guuid()
    await saveCaptcha(bodyData.datas.text, captchaUuid)
    try {
        bodyData.dbData = findDatas
        bodyData.datas.captchaId = captchaUuid
        ctx.body = bodyData
    } catch (err) {
        ctx.throw(`服务器错误：${err}`, 500)
    }

})

/**
 * 生成png图片，带干扰字符
 * width: 图片宽度
 * height: 图片高度
 * size: 验证码字符串长度
 */
router.get('/captchapng', async (ctx, next) => {
    const params = getUrlParams(ctx.request.url)
    const captcha = new Captcha(params.width || 300, params.height || 100, params.size ? Number(params.size) : 6);
    captcha.async = false // 同步
    captcha.addDecoy({ total: 3 }); // 添加干扰字符
    captcha.drawTrace(); // 添加干扰线条
    captcha.drawCaptcha({ colors: ['red', 'blue', 'gold', 'green', 'orange', 'cameo'] });
    const captchapng = 'data:image/png;base64,' + captcha.png.toString('base64') // 添加图片前缀
    let captchaId = guuid()
    await saveCaptcha(captcha.text, captchaId)
    try {
        ctx.body = {
            datas: {
                data: captchapng,
                text: captcha.text,
                captchaId: captchaId
            },
            state: 200,
            msg: '验证码获取成功',
            success: true
        }
    } catch (err) {
        ctx.throw(`服务器错误：${err}`, 500)
    }
})
// 验证码验证
router.post('/verify', async (ctx, next) => {
    const req = ctx.request.body
    let result = await findData({uuid: req.captchaId})
    try {
        
        ctx.body = {
            datas: result,
            state: 200,
            msg: result[0].code == req.code ? '验证成功' : '验证失败',
            success: result[0].code == req.code
        }
    } catch (err) {
        ctx.throw(`服务器错误：${err}`, 500)
    }

})


fs.writeFile('./routerMap.json', JSON.stringify(routerMap, null, 4), err => {
    if (!err) {
        console.log('api下所有文件路径读取正确')
    }
})

// 跨域中间件配置
app.use(
    cors({
        origin: '*',
        maxAge: 5,
        methods: ['GET', 'POST'],
        allowHeaders: ['Content-Type'],
        credentials: true,

    })
)

app.use(apiRouter.routes())
    .use(apiRouter.allowedMethods())
app.use(router.routes())
    .use(router.allowedMethods())
app.listen(8888)

