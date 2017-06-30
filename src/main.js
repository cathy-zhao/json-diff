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
    * @return {[type]}    object delta     [description]
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
        let returnAr = []
        let delta = diffpatch.diff(oldData, newData);
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
                    if (item.length === 1) {  // 代表新增
                        changeStr += desc['add'](dict, item[0])
                        returnAr.push({type:'add',key:key,old:'',new: item[0]})
                    } else if (item.length === 2) { // 代表更新
                        changeStr += desc['update'](dict, item[0], item[1])
                        returnAr.push({type:'update',key: key, old:item[0],new: item[1] })
                    } else if (item.length === 3 && (item[1] === 0 && item[2] === 0)) { // 代表删除
                        changeStr += desc['delete'](dict, item[0])
                        returnAr.push({type:'delete',key: key, old:item[0], new: '' })
                    }
                } else if (Object.prototype.toString.call(item) === '[object Object]' && Object.keys(item).length > 0 && item['_t'] === 'a') { // 数组列表 不好比较 这里不做递归了 只打算遍历2层
                    for (let key1 in item) {
                        let arrItem = item[key1]
                        if (key1 === '_t')
                            continue
                        if (Object.prototype.toString.call(arrItem) === '[object Array]') {
                            if (arrItem.length >= 1 && Object.prototype.toString.call(arrItem[0]) == '[object Object]')
                                continue // 不深度遍历
                            if (arrItem.length === 1) {
                                changeStr += desc['add'](dict, arrItem[0])
                                returnAr.push({type:'add',key:key,old:'',new: arrItem[0]})
                            } else if (arrItem.length === 2) {
                                changeStr += desc['update'](dict, arrItem[0], arrItem[1])
                                returnAr.push({type:'update',key: key, old:arrItem[0],new: arrItem[1] })
                            } else if (arrItem.length === 3 && (arrItem[1] === 0 && arrItem[2] === 0)) {
                                changeStr += desc['delete'](dict, arrItem[0])
                                returnAr.push({type:'delete',key: key, old:arrItem[0],new: '' })
                            }
                        }
                    }
                }
            }
        }

        // 创建 改动点  area
        let h2 = document.createElement("h2");
        h2.innerHTML = '数据改动点:'
        let footer = document.createElement("div");
        footer.className = 'footer-diff' // css  in html.css
        footer.innerHTML = changeStr
        // beautiful html diff
        document.getElementById('swal-text-holder').innerHTML = delta && changeStr
            ? formatters.html.format(delta, oldData)
            : formatters.html.format({}, newData);
        document.getElementById('swal-text-holder').appendChild(h2)
        document.getElementById('swal-text-holder').appendChild(footer)

        return returnAr
    }


    /**
* 显示日志  分页 在修改比对按钮旁边加一个查看修改日志按钮，点击触发
* @param  {[type]} configAppID     配置应用的ID
* @param  {[type]} configID        配置ID
* @param  {[type]} mappingObj 配置表单域的名称的字典
* @return {[type]}                 [description]
*/

    showLogs(configAppID, configID, mappingObj) {
        swal({title: "日志对比：", text: "<div id='table-list' style='max-height: 650px; overflow: auto;'></div>", html: true})
        var htmls  =`<table id='js-table-data'  style="margin: 10px auto;"  border="1" cellspacing="0" cellpadding="0" width="100%" > </table >
         <table width='60%' align='center'>
            <tr>
                <td>
                    <div id='con' name='con' style="display:flex"></div>
                </td>
            </tr>
        </table>`
        document.getElementById('table-list').innerHTML = htmls

        window.Page = function (pno, pageSize) {
          httpx.request({
              url: `http://pbl4configlog.dev.web.nd/v0.1/logs?configAppId=${configAppID}&configId=${configID}&$offset=${ pno  * pageSize  - pageSize }&$limit=${ pageSize }`,
              method: "GET", // Custom http method
              headers: {}, // Custom http headers
              success: function(response) {
                    let reObj = JSON.parse(response)
                    let total = reObj.total  //表格所有行数(所有记录数)

                    let totalPage = 0; //总页数
                    //总共分几页
                    if (total / pageSize > parseInt(total / pageSize)) {
                        totalPage = parseInt(total / pageSize) + 1;
                    } else {
                        totalPage = parseInt(total / pageSize);
                    }

                    let contain = document.getElementById("js-table-data");
                    let items = reObj.items
                    let tableStr = ''
                    if( items && items.length > 0 ){
                      let desc = {
                          add: (item, old, newVal) => `<li>新增了<strong>${item}</strong>，新值为"${newVal}"</li>`,
                          save: (item, old, newVal) => `<li>新增了<strong>${item}</strong>，新值为"${newVal}"</li>`,
                          update: (item, old, newVal) => `<li>修改了<strong>${item}</strong>，旧值为"${old}"，新值为"${newVal}"</li>`,
                          delete: (item, old, newVal) => `<li>删除了<strong>${item}</strong>，旧值为"${old}"</li>`
                      }
                      items.map(
                        (ii,index)=>{
                          let st = ''
                          let change = JSON.parse(ii.diff)
                          change && change.map(per => st += desc[per.type.trim()](mappingObj[per.key] ? mappingObj[per.key] : per.key, per.old, per.new))
                          tableStr += `<tr>
                          <td style="WORD-WRAP: break-word" width="15%">${ii.configAppId}</td>
                          <td style="WORD-WRAP: break-word" width="15%">${ii.configId}</td>
                          <td style="WORD-WRAP: break-word; text-align: left;list-style:none;padding: 5px"  >${st}</td>
                          <td style="WORD-WRAP: break-word" width="15%">${ii.remark}</td>
                        </tr>`
                        }
                      )
                    }
                    contain.innerHTML = `<tr> <th style=";">配置应用ID</th>
                              <th style=";">配置ID</th>
                              <th style=";">改动点</th>
                              <th style=";">备注</th>
                              </tr>` +   tableStr

                    let tempStr = "共" + total + "条记录,分" + totalPage + "页,当前第" + pno + "页 ";
                    //判断页数>1时
                    if (pno > 1) {
                        tempStr += `<a style='text-decoration: none;' href=# onClick=Page(1,${pageSize})>首页 </a>`;
                        tempStr += `<a style='text-decoration: none;' href=# onClick=Page(${pno - 1},${pageSize})><上一页 </a>`
                    } else {
                        tempStr += "首页";
                        tempStr += "<上一页";
                    }
                    //判断页数<总页数时
                    if (pno < totalPage) {
                        tempStr += `<a style='text-decoration: none;' href=# onClick=Page(${pno + 1},${pageSize})> 下一页></a>`
                        tempStr += `<a style='text-decoration: none;' href=# onClick=Page(${totalPage},${pageSize})> 尾页</a>`
                    } else {
                        tempStr += "下一页>";
                        tempStr += "尾页";
                    }
                    document.getElementById("con").innerHTML = tempStr;
                  }
          });
        }

        // init
        Page(1,5)
    }

    /**
* 保存日志
* @param {number} configAppID 配置应用 ID
* @param {number} configID 配置 ID
* @param {string} diff 比对内容
* @return {Promise}
*/
    saveLog(configAppID, configID, diff, userId) {
        swal({
            title: "保存比对日志",
            text: "",
            type: "input",
            showCancelButton: true,
            closeOnConfirm: false,
            showLoaderOnConfirm: true,
            inputPlaceholder: "填写备注"
        }, function(inputValue) {
            if (inputValue === false)
                return false;
            if (inputValue === "") {
                swal.showInputError("备注不能为空哦!");
                return false
            }
            httpx.request({
                url: "http://pbl4configlog.dev.web.nd/v0.1/logs",
                method: "POST",
                headers: {},
                contentType: "application/json",
                data: JSON.stringify({configAppId: configAppID, configId: configID, diff: diff, remark: inputValue, userId: userId}),
                success: function(data) {
                    console.log(data);
                    swal("保存成功");
                },
                error: function(url, e) {
                    console.log(url, e)
                    swal("保存失败");
                }
            });

        });

    }

}

let configLogs = new ConfigLogs('configLogs');
configLogs.showLogs('ccc','ccc',{ arrlist : 'shuzu对象'})
// let del = configLogs.showDiff({
//     a: 123,
//     b: 344,
//     arr: [
//         '11', '2'
//     ],
//     arrlist: [12],
//     cc: 'asdsadfasdf',
//     date: new Date()
// }, {
//     a: 123,
//     b: 344,
//     date: new Date('2010-08-08'),
//     arr: [
//         '11', '2'
//     ],
//     arrlist: [
//         {
//             'qwe': 123
//         }, {
//             'qwe': 444
//         }
//     ],
//     cc: 'asdsadfasdf'
// }, {
//     'a': 'a的字典',
//     'b': 'b的字典',
//     'aa': 'aa的字典'
// });
// configLogs.saveLog('ccc', 'ccc', del, 100013)
//
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
//
