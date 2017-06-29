import jsondiffpatch from 'jsondiffpatch'

import formatters from './js/jsondiffpatch-formatters.min.js'

import './css/html.css'
import './css/annotated.css'
//弹窗
import swal from 'sweetalert'
import './css/sweetalert.css'
//请求库
import httpx from './js/httpx'

class ConfigLogs {
    constructor(name) {
        this.name = name;
    }

    /**
    * 显示当前表单的修改比对  在保存按钮旁边加一个修改比对按钮，点击触发`showDiff`；
    * @param  {[type]} oldData [description]
    * @param  {[type]} newData [description]
    * @param  {[type]} mappingObj [数据字典]
    // * @param  {[type]} filterArr [过滤不对比]
    * @return {[type]}         [description]
    */
    showDiff(oldData, newData, mappingObj) {

        var diffpatch = jsondiffpatch.create({
            // used to match objects when diffing arrays, by default only === operator is used
            objectHash: function(obj, index) {
                // this function is used only to when objects are not equal by ref
                return obj.aaaaaaaaaaaa
            },
            arrays: {
                // default true, detect items moved inside the array (otherwise they will be registered as remove+add)
                detectMove: true,
                // default false, the value of items moved is not included in deltas
                includeValueOnMove: false
            },
            textDiff: {
                // default 60, minimum string length (left and right sides) to use text diff algorythm: google-diff-match-patch
                minLength: 60
            },
            propertyFilter: function(name, context) {
                /*
               this optional function can be specified to ignore object properties (eg. volatile data)
                name: property name, present in either context.left or context.right objects
                context: the diff context (has context.left and context.right objects)
              */
                return name.slice(0, 1) !== '$';
            },
            cloneDiffValues: false/* default false. if true, values in the obtained delta will be cloned
              (using jsondiffpatch.clone by default), to ensure delta keeps no references to left or right objects. this becomes useful if you're diffing and patching the same objects multiple times without serializing deltas.
              instead of true, a function can be specified here to provide a custom clone(value)
              */
        });
        // 比较数据
        var delta = diffpatch.diff(oldData, newData);
        // 创建弹窗
        swal({title: "新的数据源：", text: "<div id='swal-text-holder' style='max-height: 650px; overflow: auto;'>1</div>", html: true})

        let changeStr = ''

        if (delta && Object.keys(delta).length > 0) {
            let desc = {
                add: (item, newVal) => `<li>新增了<strong>${item}</strong>，新值为"${newVal}" 。</li>`,
                update: (item, old, newVal) => `<li>修改了<strong>${item}</strong>，旧值为"${old}"，新值为"${newVal}"。</li>`,
                delete: (item, old) => `<li>删除了<strong>${item}</strong>，旧值为"${old}" 。</li>`
            }

            for (let key in delta) {
                let dict = mappingObj[key]
                    ? mappingObj[key]
                    : key
                let item = delta[key]
                if (Object.prototype.toString.call(item) === '[object Array]') {
                    if (item.length === 1) {
                        changeStr += desc['add'](dict, item[0])
                    } else if (item.length === 2) {
                        changeStr += desc['update'](dict, item[0], item[1])
                    } else if (item.length === 3 && (item[1] === 0 && item[2] === 0)) { // 代表删除
                        changeStr += desc['delete'](dict, item[0])
                    }
                } else if (Object.prototype.toString.call(item) == '[object Object]' && Object.keys(item).length > 0 && item['_t'] === 'a') { // 这里不做递归了 只打算遍历2层
                    for (let key1 in item) {
                        let arrItem = item[key1]
                        if (key1 === '_t')
                            continue
                        if (Object.prototype.toString.call(arrItem) === '[object Array]') {
                            if (arrItem.length >= 1 && Object.prototype.toString.call(arrItem[0]) == '[object Object]')
                                break // 不深度遍历
                            if (arrItem.length === 1) {
                                changeStr += desc['add'](dict, arrItem[0])
                            } else if (arrItem.length === 2) {
                                changeStr += desc['update'](dict, arrItem[0], arrItem[1])
                            } else if (arrItem.length === 3 && (arrItem[1] === 0 && arrItem[2] === 0)) { // 代表删除
                                changeStr += desc['delete'](dict, arrItem[0])
                            }
                        }
                    }
                }
            }
        }
        console.log(delta)
        console.log(changeStr)
        // 创建 改动点  area
        var h2 = document.createElement("h2");
        h2.innerHTML = '数据改动点:'
        var footer = document.createElement("div");
        footer.className = 'footer-diff' // css  in html.css
        footer.innerHTML = changeStr
        // beautiful html diff
        document.getElementById('swal-text-holder').innerHTML = delta && changeStr
            ? formatters.html.format(delta, oldData)
            : formatters.html.format({}, newData);
        document.getElementById('swal-text-holder').appendChild(h2)
        document.getElementById('swal-text-holder').appendChild(footer)
    }
    /**
     * [changeMap description]
     * @param  {[type]} delta      [jsondiffdleta]
     * @param  {[type]} mappingObj [字典]
     * @return {[type]}            [string ]
     */
    changeMap(delta, mappingObj) {}

    /**
* 显示日志  分页 在修改比对按钮旁边加一个查看修改日志按钮，点击触发
* @param  {[type]} configAppID     配置应用的ID
* @param  {[type]} configID        配置ID
* @param  {[type]} configFieldsMap 配置表单域的名称的字典
* @return {[type]}                 [description]
*/

    showLogs(configAppID, configID, configFieldsMap) {

        httpx.request({
            url: "http://pbl4configlog.dev.web.nd/v0.1/logs?configAppId=0f6e7759fecd49e2bd76f05b57cfaf66&configId=birthday", method: "GET", // Custom http method
            headers: {}, // Custom http headers
            success: function(data) {
                console.log(data);
            }
        });

    }

    /**
* 保存日志
* @param {number} configAppID 配置应用 ID
* @param {number} configID 配置 ID
* @param {string} diff 比对内容
* @param {string} remark 备注 用户显式输入保存
* @return {Promise}
*/
    saveLog(configAppID, configID, diff, remark) {

        httpx.request({
            url: "http://pbl4configlog.dev.web.nd/v0.1/logs",
            method: "POST",
            headers: {},
            dataType: 'json',
            contentType: "application/json",
            data: JSON.stringify({
                configAppId: "rinimarinimarinima",
                configId: "rinimarinimarinima",
                diff: [
                    {
                        type: "save ",
                        key: "task_name",
                        old: "生日",
                        new: "111日升"
                    }
                ],
                remark: "rinimarinimarinima",
                userId: 820514
            }),
            success: function(data) {
                console.log(data);
            }
        });

    }

}

let configLogs = new ConfigLogs('configLogs');
configLogs.showDiff({
    a: 123,
    b: 344,
    arr: [
        '11', '2'
    ],
    arrlist: [
        {
            'qwe': 123
        }, {
            'qwe': 444
        }
    ],
    cc: 'asdsadfasdf',
    date: new Date()
}, {
    a: 123,
    b: 344,
    date: new Date('2010-08-08'),
    arr: [
        '11', '2'
    ],
    arrlist: [
        {
            'qwe': 123
        }, {
            'qwe': 444
        }
    ],
    cc: 'asdsadfasdf'
}, {
    'a': 'a的字典',
    'b': 'b的字典',
    'aa': 'aa的字典'
});
// configLogs.showDiff({
//     a: 123,
//     b: 344,
//     arr: [
//         '11', '2'
//     ],
//     arrlist: [
//         {
//             'qwe': '123aa'
//         }, {
//             'qwe': 'sdfds'
//         }, {
//             'asfa': 'zzzzzzzzz'
//         }
//     ],
//     cc: 'asdsadfasdf'
//
// }, {
//     b: 123,
//     arr: [
//          '11', 'qwer'
//     ],
//     aa: 123,
//     arrlist: [
//         {
//             'qwe': 1235555
//         }, {
//             'qwe': 444444
//         }
//     ],
//     cc: 'asds``````````adfasdf'
// }, {
//     'a': 'a的字典',
//     'b': 'b的字典',
//     'aa': 'aa的字典'
// });
configLogs.saveLog()
