'use strict';
const path = require('path')

const Package = require('@starfish-cli/package')
const log = require('@starfish-cli/log')
const {spawn} = require('@starfish-cli/utils')
const SETTINGS = {
    init: '@imooc-cli/init'
}
const CACHE_DIR = 'dependencies/'
async function exec() {
    let pkg
    let targetPath = process.env.CLI_TARGET_PATH
    const homePath = process.env.CLI_HOME_PATH
    log.verbose('targetPath', targetPath)
    log.verbose('homePath', homePath)
    // console.log(arguments)
    const cmdObj = arguments[arguments.length - 1]
    const cmdName = cmdObj.name()
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'
    // console.log(cmdObj.force)
    // console.log(arguments)
    // TODO
    let storeDir
    if (!targetPath) {
        // 生成缓存路径
        targetPath = path.resolve(homePath, CACHE_DIR)
        storeDir = path.resolve(targetPath, 'node_modules')
        log.verbose('storeDir', storeDir)
        pkg = new Package({
            targetPath,
            packageName,
            storeDir,
            packageVersion
        })
        if (await pkg.exists()) {
            // 更新package
            await pkg.update()
        } else {
            // 安装package
            await pkg.install()
        }
    } else {
        pkg = new Package({
            targetPath,
            packageName,
            storeDir,
            packageVersion
        })
    }
    const rootFile = await pkg.getRootFilePath()
    if(rootFile){
        try{
            // require(rootFile).call(null, Array.from((arguments)))
            const args = Array.from((arguments))
            const cmd = args[args.length - 1]
            const o = Object.create(null)
            Object.keys(cmd).forEach(key => {
                if(cmd.hasOwnProperty(key) &&
                    !key.startsWith('_') &&
                    key !== 'parent'
                ){
                    o[key] = cmd[key]
                }
            })
            args[args.length - 1] = o
            const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`
            const child = spawn('node', ['-e', code], {
                cwd: process.cwd(),
                stdio: 'inherit'
            })
            child.on('error', e => {
                log.error(e.message)
                process.exit(1)
            })
            child.on('exit', e => {
                log.verbose('命令执行成功:' + e)
                process.exit(e)
            })
            
        }catch(e){
            log.error(e.message)
        }
    }
}
// function spawn(command, args, options){
//     const win32 = process.platform == 'win32'
//     const cmd = win32 ? 'cmd' : command
//     const cmdArgs = win32 ? ['/c'].concat(command, args):args
//     return cp.spawn(cmd, cmdArgs, options || {})
// }
module.exports = exec;

