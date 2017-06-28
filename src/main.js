
import   'js/jsondiffpatch.min.js'
import  'js/jsondiffpatch-formatters.min.js'
import 'css/annotated.css'
import 'css/html.css'

class Customer {
    constructor(name) {
        this.name = name;
    }

    sayHi() {
        console.log(`The name is: ${this.name}`)
        console.info(`foo's Uppercase: ${_.upperCase('foo')}`)
    }



}

let kevin = new Customer('kevin');

kevin.sayHi();