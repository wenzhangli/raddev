;(function(){
/*!
* EUSUI(xui) JavaScript Library v2.1
* http://itjds.net
* 
* Copyright ( 2004 ~ present) itjds.net
* Released under the MIT license
*
*/
// speed up references
var undefined, window = this, document = window.document;
if (!document) throw new Error("EUSUI requires a window with a document");

// global : xui
// we have to keep xui for gloable var
var xui = window.xui = function (nodes, flag) {
    return xui.Dom.pack(nodes, flag)
};

// Class & Namespace
xui.Class = function (key, pkey, obj) {
    var _Static, _parent = [], self = xui.Class, w = window, env = self._fun, reg = self._reg, parent0, _this, i, t, _t,
        _c = self._all,
        _funadj = function (str) {
            return (str + "").replace(/(\s*\/\*[^*]*\*+([^\/][^*]*\*+)*\/)|(\s*\/\/[^\n]*)|(\)[\s\S]*)/g, function (a) {
                return a.charAt(0) != ")" ? "" : a
            });
        }
    obj = obj || {};
    //exists?
    if (!self._ignoreNSCache && (t = xui.get(w, key.split('.'))) && typeof(t) == 'function' && t.$xuiclass$) return self._last = t;
    //clear SC
    if (t = xui.get(w, ['xui', '$cache', 'SC'])) delete t[key];

    //multi parents mode
    pkey = (!pkey ? [] : typeof pkey == 'string' ? [pkey] : pkey);
    for (i = 0; t = pkey[i]; i++)
        if (!(_parent[i] = (xui.get(w, t.split('.')) || (xui && xui.SC && xui.SC(t)))))
            throw 'errNoParent--' + t;
    if (obj.Dependencies) {
        if (typeof obj.Dependencies == "string") obj.Dependencies = [obj.Dependencies];
        for (i = 0; t = obj.Dependencies[i]; i++)
            if (!(xui.get(w, t.split('.')) || (xui && xui.SC && xui.SC(t))))
                throw 'errNoDependency--' + t;
    }
    parent0 = _parent[0];

    // Give a change to modify the original object
    var $Start = obj.$Start || (parent0 && parent0.$Start);
    xui.tryF($Start, [], obj);

    // collect items
    _Static = obj.Static || {};
    t = {};
    for (i in _Static)
        if (reg[i]) t[i] = 1;
    for (i in t)
        delete _Static[i];

    //before and after will pass to children
    _Static.Before = obj.Before || (parent0 && parent0.Before);
    _Static.After = obj.After || (parent0 && parent0.After);
    _Static.$Start = $Start;
    _Static.$End = obj.$End || (parent0 && parent0.$End);
    _Static.__gc = obj.__gc || _Static.__gc || (parent0 && parent0.__gc) || function () {
        xui.Class.__gc(this.$key)
    };

    /*set constructor first and create _this
    upper is the first parent Class
    */
    var cf = function () {
        if (xui.Class.$instanceCreated) xui.Class.$instanceCreated(this);
        if (typeof this.initialize == 'function') this.initialize()
    };
    if (typeof obj.Constructor == 'function') {
        _this = env(obj.Constructor, 'Constructor', key, parent0 || cf, 'constructor');
        _this.Constructor = _funadj(obj.Constructor);
    } else {
        if (parent0) {
            // Constructor is for opera, in opear fun.toString can't get arguments sometime
            var f = cf, str = parent0.Constructor;
            if (str) f = new Function(str.slice(str.indexOf("(") + 1, str.indexOf(")")).split(','), str.slice(str.indexOf("{") + 1, str.lastIndexOf("}")));
            _this = env(f, 'Constructor', key, parent0.upper, 'constructor');
            _this.Constructor = _funadj(str);
        } else
            _this = cf;
    }

    //collect parent items, keep the last one
    _t = xui.fun();
    for (i = _parent.length - 1; t = _parent[i--];) {
        xui.merge(_t, t);
        xui.merge(_t.prototype, t.prototype);
    }
    //set keys
    _this.KEY = _this.$key = _this.prototype.KEY = _this.prototype.$key = key;
    //envelop
    //  from Static
    self._wrap(_this, _Static, 0, _t, 'static');
    //  from Instance
    if (t = obj.Instance)
        self._wrap(_this.prototype, t, 1, _t.prototype, 'instance');
    //inherite from parents
    self._inherit(_this, _t);
    self._inherit(_this.prototype, _t.prototype);
    _t = null;

    //exe before functoin
    if (xui.tryF(_this.Before, arguments, _this) === false)
        return false;

    //add child key to parents
    for (i = 0; t = _parent[i]; i++) {
        t = (t.$children || (t.$children = []));
        for (var j = 0, k = t.length, b; j < k; j++)
            if (t[k] == key) {
                b = true;
                break;
            }
        if (!b) t[t.length] = key;
    }

    //set symbol
    _this.$xui$ = _this.$xuiclass$ = 1;
    _this.$children = [];
    _this.$parent = _parent;

    //set constructor
    _this.prototype.constructor = _this;
    _this.prototype.$xui$ = 1;
    //set key
    _this[key] = _this.prototype[key] = true;

    //allow load App.Sub first
    _t = t = xui.get(w, key.split('.'));
    xui.set(w, key.split('.'), _this);
    if (Object.prototype.toString.call(_t) == '[object Object]')
        for (i in _t) _this[i] = _t[i];

    //exe after function
    xui.tryF(_this.After, [], _this);
    //exe ini function
    xui.tryF(obj.Initialize, [], _this);
    xui.tryF(_this.$End, [], _this);

    xui.breakO([obj.Static, obj.Instance, obj], 2);

    if (!(key in _c)) {
        _c[key] = _c.length;
        _c.push(key);
    }

    //return Class
    return self._last = _this;
};
xui.Namespace = function (key) {
    var a = key.split('.'), w = window;
    return xui.get(w, a) || ((xui.Namespace._all[a[0]] = 1) && xui.set(w, a, {}));
};
xui.Namespace._all = {};

//window.onerror will be redefined in xui.Debugger
//window.onerror=function(){return true};

/*merge hash from source to target
  target:hash
  source:hash
  type:'all', 'with', 'without'[default], or function <return true will trigger merge>
  return: merged target
*/
xui.merge = function (target, source, type, force) {
    var i, f;
    if (typeof type == "function") {
        f = type;
        type = 'fun';
    }
    switch (type) {
        case 'fun':
            for (i in source) if ((force || source.hasOwnProperty(i)) && true === f(source[i], i)) target[i] = source[i];
            break;
        case 'all':
            for (i in source) if ((force || source.hasOwnProperty(i))) target[i] = source[i];
            break;
        case 'with':
            for (i in source) if ((force || source.hasOwnProperty(i)) && target.hasOwnProperty(i)) target[i] = source[i];
            break;
        default:
            for (i in source) if ((force || source.hasOwnProperty(i)) && !target.hasOwnProperty(i)) target[i] = source[i];
    }
    return target;
};

new function () {
    var lastTime = 0, vendors = ['ms', 'moz', 'webkit', 'o'], w = window, i = 0, l = vendors.length, tag;
    for (; i < l && !w.requestAnimationFrame && (tag = vendors[i++]);) {
        w.requestAnimationFrame = w[tag + 'RequestAnimationFrame'];
        w.cancelAnimationFrame = w[tag + 'CancelAnimationFrame'] || w[tag + 'CancelRequestAnimationFrame'];
    }
    w.requestAnimationFrame = w.requestAnimationFrame || function (callback, element) {
        var currTime = (new Date()).getTime(),
            timeToCall = Math.max(0, 1000 / 60 - (currTime - lastTime)),
            id = setTimeout(function () {
                callback(currTime + timeToCall)
            }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
    w.cancelAnimationFrame = w.cancelAnimationFrame || function (id) {
        clearTimeout(id)
    };
    w.requestIdleCallback = w.requestIdleCallback || function (cb) {
        return setTimeout(function () {
            var start = Date.now();
            cb({
                didTimeout: false,
                timeRemaining: function () {
                    return Math.max(0, 50 - (Date.now() - start));
                }
            });
        }, 1);
    };
    w.cancelIdleCallback = w.cancelIdleCallback || function (id) {
        clearTimeout(id)
    };
};

new function () {
    var _to = Object.prototype.toString;
    xui.merge(xui, {
        stamp: function () {
            return +new Date()
        },
        rand: function () {
            return parseInt(xui.stamp() * Math.random(), 10).toString(36);
        },
        setTimeout: function (callback, delay) {
            return (delay === false || (delay || 0) > 1000 / 60) ? (setTimeout(callback, delay || 0) * -1) : requestAnimationFrame(callback);
        },
        clearTimeout: function (id) {
            if (id >= 0) cancelAnimationFrame(id);
            else clearTimeout(Math.abs(id));
        },
        fun: function () {
            return function () {
            }
        },
        exec: function (script, id, closure) {
            var me = this,
                d = document,
                h = d.getElementsByTagName("head")[0] || d.documentElement,
                s = d.createElement("script"), n;
            if (closure) script = "!function(){" + script + "}(window)";
            s.type = "text/javascript";
            if (id) {
                if ((n = d.getElementById(id)) && n.parentNode == h) {
                    h.removeChild(n);
                }
                s.id = id;
            }
            if (xui.browser.ie)
                s.text = script;
            else
                s.appendChild(d.createTextNode(script));
            h.appendChild(s);
            s.disalbed = true;
            s.disabled = false;
            if (!id) {
                h.removeChild(s);
            }
            return s;
        },
        /*
        get something from deep hash
        hash:target hash
        arr:path array,
        example:
        xui.get({a:{b:{c:1}}},['a','b']) => {c:1};
            xui.get({a:{b:{c:1}}},['a','b','c']) => 1;
            xui.get({a:{b:{c:1}}},['a','b','c','d']) => undefined;
        */
        get: function (hash, path) {
            if (!path) return hash;
            if (!xui.isSet(hash)) return undefined;
            else if (typeof path == 'string') return hash[path];
            else {
                for (var i = 0, l = path.length, t; i < l;) {
                    if (!(t = path[i++] + '')) continue;
                    if (!hash || (hash = t != (t = t.replace("()", "")) ? (typeof(hash[t]) == "function" && 0 !== t.indexOf("set")) ? hash[t]() : undefined : hash[t]) === undefined) return;
                }
                return hash;
            }
        },
        /*
        set/unset a value to deep hash
        example:
            xui.set({a:{b:{c:1}}},['a','b','c'],2) => {a:{b:{c:2}}}
            xui.set({a:{b:{c:1}}},['a','b','c']) => {a:{b:{}}}
        */
        set: function (hash, path, value) {
            if (!hash) return;
            if (typeof path != 'string') {
                var v, i = 0, m, last = path.length - 1;
                for (; i < last;) {
                    v = path[i++];
                    if (hash[v] && ((m = typeof hash[v]) == 'object' || m == 'function')) hash = hash[v];
                    else hash = hash[v] = {};
                }
                path = path[last];
            }
            // the last one can be a [set] function
            if (path != (path = (path + "").replace("()", ""))) {
                if (typeof(hash[path]) == "function") {
                    hash[path](value);
                    return value;
                }
            } else {
                if (value === undefined) {
                    if (hash.hasOwnProperty && hash.hasOwnProperty(path))
                        delete hash[path];
                    else hash[path] = undefined;
                } else {
                    return hash[path] = value;
                }
            }
        },
        /* try to excute a function
        fun:target function
        args:arguments for fun
        scope:[this] pointer for fun
        df:default return vale
        */
        tryF: function (fun, args, scope, df) {
            return (fun && typeof fun == 'function') ? fun.apply(scope || {}, args || []) : df
        },
        /*asynchronous run function
        fun:target function
        defer: setTimeout defer time
        args: arguments for fun
        scope: [this] pointer for fun
        */
        asyRun: function (fun, defer, args, scope) {
            //defer must set in opera
            return xui.setTimeout(typeof fun == 'string' ? function () {
                xui.exec(fun)
            } : function () {
                fun.apply(scope, args || []);
                fun = args = null;
            }, defer);
        },
        idleRun: function (fun, args, scope) {
            return window.requestIdleCallback(typeof fun == 'string' ? function () {
                xui.exec(fun)
            } : function () {
                fun.apply(scope, args || []);
                fun = args = null;
            });
        },
        asyHTML: function (content, callback, defer, size) {
            var div = document.createElement('div'),
                fragment = document.createDocumentFragment(),
                f = function () {
                    var i = size || 10;
                    while (--i && div.firstChild)
                        fragment.appendChild(div.firstChild);
                    if (div.firstChild)
                        xui.setTimeout(f, defer);
                    else
                        callback(fragment);
                };
            div.innerHTML = content;
            f();
        },
        isEmpty: function (hash) {
            if (hash == null) return true;
            if (xui.isNumb(hash)) return false;
            if (xui.isArr(hash) || xui.isStr(hash) || xui.isArguments(hash)) return hash.length === 0;
            for (var i in hash) if (Object.prototype.hasOwnProperty.call(hash, i)) return false;
            return true;
        },

        /*
        this will always run newer function
        key: for identify
        fun: to run
        defer: setTimeout defer time
        args: arguments for fun
        scope: 'this' for fun
        */
        resetRun: function (key, fun, defer, args, scope) {
            var me = xui.resetRun, k = key, cache = me.$cache || ((me.exists = function (k) {
                return this.$cache[k]
            }) && (me.$cache = {}));
            if (cache[k]) {
                xui.clearTimeout(cache[k])
            }
            if (typeof fun == 'function')
                cache[k] = xui.setTimeout(function () {
                    delete cache[k];
                    fun.apply(scope || null, args || [])
                }, defer);
            else delete cache[k];
        },
        //Dependencies: xui.Dom xui.Thread
        observableRun: function (tasks, onEnd, threadid, busyMsg) {
            xui.Thread.observableRun(tasks, onEnd, threadid, busyMsg);
        },

        /*break object memory link
        target: target object
        n: depth, default 1
        */
        breakO: function (target, depth, _layer) {
            var n = depth || 1, l = 1 + (_layer || 0), self = xui.breakO, _t = '___gc_', i;
            if (target && (typeof target == 'object' || typeof target == 'function') && target !== window && target !== document && target.nodeType !== 1) {
                try {
                    if (target.hasOwnProperty(_t)) return; else target[_t] = null
                } catch (e) {
                    return
                }
                try {
                    for (i in target) {
                        if (target.hasOwnProperty(i) && target[i]) {
                            if (typeof target[i] == 'object' || typeof target[i] == 'function')
                                if (l < n)
                                    self(target[i], n, l);
                            try {
                                target[i] = null
                            } catch (e) {
                            }
                        }
                    }
                } catch (e) {
                    return
                }
                if (target.length) target.length = 0;
                delete target[_t];
            }
        },

        /*each function for hash
        fun: fun to exec, if return false, stop the $iterator
        scope: 'this' pointer;
        */
        each: function (hash, fun, scope) {
            scope = scope || hash;
            for (var i in hash)
                if (false === fun.call(scope, hash[i], i, hash))
                    break;
            return hash;
        },
        compareVar: function (x, y, MAXL, MAXS) {
            if (x === y) return true;

            if (xui.isObj(x) || xui.isObj(y)) {
                if ((xui.isDate(x) && xui.isDate(y)) || (xui.isReg(x) && xui.isReg(y)))
                    return x + '' === y + '';
                else if ((xui.isHash(x) && xui.isHash(y)) || (xui.isArr(x) && xui.isArr(y)) || (xui.isArguments(x) && xui.isArguments(y))) {
                    x = xui.serialize(x, 0, 0, MAXL || 5, MAXS || 300);
                    y = xui.serialize(y, 0, 0, MAXL || 5, MAXS || 300);
                    return x.indexOf(xui.$_outofmilimted) == -1 && y.indexOf(xui.$_outofmilimted) == -1 && x === y;
                } else
                    return false;
            }
        },
        compareNumber: function (a, b, digits) {
            return xui.toFixedNumber(a, digits) === xui.toFixedNumber(b, digits);
        },
        toFixedNumber: function (number, digits) {
            if (!xui.isSet(digits)) digits = 2;
            var m = Math.abs(number),
                s = '' + Math.round(m * Math.pow(10, digits)),
                v, t, start, end;
            if (/\D/.test(s)) {
                v = "" + m;
            } else {
                while (s.length < 1 + digits) s = '0' + s;
                start = s.substring(0, t = (s.length - digits));
                end = s.substring(t);
                if (end) end = "." + end;
                v = start + end;
            }
            return parseFloat((number < 0 ? "-" : "") + v);
        },
        toNumeric: function (value, precision, groupingSeparator, decimalSeparator) {
            if (!xui.isNumb(value))
                value = parseFloat((value + "").replace(/\s*(e\+|[^0-9])/g, function (a, b, c) {
                    return b == 'e+' || b == 'E+' || (c == 0 && b == '-') ? b : b == decimalSeparator ? '.' : ''
                })) || 0;
            if (xui.isSet(precision) && precision >= 0)
                value = xui.toFixedNumber(value, precision);
            return value;
        },
        formatNumeric: function (value, precision, groupingSeparator, decimalSeparator, forceFillZero, trimTailZero) {
            if (xui.isSet(precision)) precision = parseInt(precision, 10);
            precision = (precision || precision === 0) ? precision : 0;
            groupingSeparator = xui.isSet(groupingSeparator) ? groupingSeparator : ",";
            decimalSeparator = decimalSeparator || ".";
            value = "" + parseFloat(value);
            if (value.indexOf('e') == -1) {
                value = xui.toFixedNumber(value, precision) + "";
                value = value.split(".");
                if (forceFillZero !== false) {
                    if ((value[1] ? value[1].length : 0) < precision) value[1] = (value[1] || "") + xui.str.repeat('0', precision - (value[1] ? value[1].length : 0));
                }
                value[0] = value[0].split("").reverse().join("").replace(/(\d{3})(?=\d)/g, "$1" + groupingSeparator).split("").reverse().join("");
                value = value.join(decimalSeparator);
            }
            return trimTailZero && value.indexOf(decimalSeparator) != -1 ? value.replace(new RegExp('[' + decimalSeparator + ']?0+$'), '') : value;
        },
        /***
         A wrapper for lots regExp string.replace to only once iterator replace
         You can use it, when
         1.replace >10
         2.need protect some regexp
         3.every long string to replac

         str: will be replace
         reg, array: [string, string] or [regex, string] or [[],[]]
         replace: to replace
         ignore_case: bool, for regexp symble 'i'
         return : replaced string

         For example:
         xui.replace("aAa","a","*",true)
         will return "*A*"
         xui.replace("aAa","a","*",false)
         will return "***"
         xui.replace("aAa","a","*")
         xui.replace("aAa",/a/,"*")         : "/a/" is OK, but not "/a/g"
         xui.replace("aAa",["a","*"])
         xui.replace("aAa",[["a","*"]])
         will return "***"
         xui.replace("aAa",[["a","*"],[/A/,"-"]])
         will return "*-*"
         Notice: there is a '$0' symbol here, for protect
         xui.replace("aba",[["ab","$0"],["a","*"]])
         will return "ab*"
         here, "ab" will be first matched and be protected to replace by express "a"
         ***/
        replace: function (str, reg, replace, ignore_case) {
            if (!str) return "";
            var i, len, _t, m, n, flag, a1 = [], a2 = [],
                me = arguments.callee,
                reg1 = me.reg1 || (me.reg1 = /\\./g),
                reg2 = me.reg2 || (me.reg2 = /\(/g),
                reg3 = me.reg3 || (me.reg3 = /\$\d/),
                reg4 = me.reg4 || (me.reg4 = /^\$\d+$/),
                reg5 = me.reg5 || (me.reg5 = /'/),
                reg6 = me.reg6 || (me.reg6 = /\\./g),
                reg11 = me.reg11 || (me.reg11 = /(['"])\1\+(.*)\+\1\1$/)
            ;

            if (!xui.isArr(reg)) {
                reg = [reg, replace]
            } else {
                ignore_case = replace
            }
            if (!xui.isArr(reg[0])) {
                reg = [reg]
            }
            ;
            xui.arr.each(reg, function (o) {
                m = typeof o[0] == 'string' ? o[0] : o[0].source;
                n = o[1] || "";
                len = ((m).replace(reg1, "").match(reg2) || "").length;
                if (typeof n != 'function') {
                    if (reg3.test(n)) {
                        //if only one paras and valid
                        if (reg4.test(n)) {
                            _t = parseInt(n.slice(1), 10);
                            if (_t <= len) n = _t;
                        } else {
                            flag = reg5.test(n.replace(reg6, "")) ? '"' : "'";
                            i = len;
                            while (i + 1)
                                n = n.split("$" + i).join(flag + "+a[o+" + i-- + "]+" + flag);

                            n = new Function("a,o", "return" + flag + n.replace(reg11, "$1") + flag);
                        }
                    }
                }
                a1.push(m || "^$");
                a2.push([n, len, typeof n]);
            });


            return str.replace(new RegExp("(" + a1.join(")|(") + ")", ignore_case ? "gim" : "gm"), function () {
                var i = 1, j = 0, args = arguments, p, t;
                if (!args[0]) return "";
                while (p = a2[j++]) {
                    if (t = args[i]) {
                        switch (p[2]) {
                            case 'function':
                                //arguments:
                                //1: array, all arguments;
                                //2: the data position index,  args[i] is $0;
                                //3: the regexp index
                                return p[0](args, i, j - 1);
                            case 'number':
                                return args[p[0] + i];
                            default:
                                return p[0];
                        }
                    } else {
                        i += p[1] + 1;
                    }
                }
            });
        },
        /*shadow copy for hash/array
        * var a=[]; a.b='b'; a.b will not be copied
        */
        copy: function (hash, filter) {
            return xui.clone(hash, filter, 1);
        },
        /*deep copy for hash/array, and hash/array only
        * var a=[]; a.b='b'; a.b will not be cloned
        *be careful for dead lock
        */
        clone: function (hash, filter, deep, _layer) {
            _layer = _layer || 0;
            if (hash && (xui.isHash(hash) || xui.isArr(hash))) {
                if (xui.isObj(hash)) {
                    var me = xui.clone,
                        isArr = xui.isArr(hash),
                        h = isArr ? [] : {},
                        i = 0, v, l;

                    if (!xui.isSet(deep)) deep = 100; else if (deep <= 0) return hash;

                    if (isArr) {
                        l = hash.length;
                        for (; i < l; i++) {
                            if (typeof filter == 'function' && false === filter.call(hash, hash[i], i, _layer + 1, h)) continue;
                            h[h.length] = ((v = hash[i]) && deep && (xui.isHash(v) || xui.isArr(v))) ? me(v, filter, deep - 1, _layer + 1) : v;
                        }
                    } else {
                        for (i in hash) {
                            if (filter === true ? i.charAt(0) == '_' :
                                filter === false ? (i.charAt(0) == '_' || i.charAt(0) == '$') :
                                    typeof filter == 'function' ? false === filter.call(hash, hash[i], i, _layer + 1, h) : 0)
                                continue;
                            h[i] = ((v = hash[i]) && deep && (xui.isHash(v) || xui.isArr(v))) ? me(v, filter, deep - 1, _layer + 1) : v;
                        }
                    }
                    return h;
                } else return hash;
            } else return hash;
        },
        /*filter hash/array
        filter: filter function(will delete "return false")
        */
        filter: function (obj, filter, force) {
            if (!force && obj && xui.isArr(obj)) {
                var i, l, v, a = [], o;
                for (i = 0, l = obj.length; i < l; i++) a[a.length] = obj[i];
                obj.length = 0;
                for (i = 0, l = a.length; i < l; i++)
                    if (typeof filter == 'function' ? false !== filter.call(a, a[i], i) : 1)
                        obj[obj.length] = a[i];
            } else {
                var i, bak = {};
                for (i in obj)
                    if (filter === true ? i.charAt(0) == '_' :
                        filter === false ? (i.charAt(0) == '_' || i.charAt(0) == '$') :
                            typeof filter == 'function' ? false === filter.call(obj, obj[i], i) : 0)
                        bak[i] = 1;

                for (i in bak)
                    delete obj[i];
            }
            return obj;
        },
        /*convert iterator to Array
        value: something can be iteratorred
        xui.toArr({a:1},true) => [a];
        xui.toArr({a:1},false) => [1];
        xui.toArr('a,b') => ['a','b'];
        xui.toArr('a;b',';') => ['a','b'];
        */
        toArr: function (value, flag) {
            if (!value) return [];
            var arr = [];
            //hash
            if (typeof flag == 'boolean')
                for (var i in value)
                    arr[arr.length] = flag ? i : value[i];
            //other like arguments
            else {
                if (xui.isHash(value)) {
                    for (var i in value) {
                        arr.push({key: i, value: value[i]});
                    }
                } else if (typeof value == 'string')
                    arr = value.split(flag || ',');
                else
                    for (var i = 0, l = value.length; i < l; ++i)
                        arr[i] = value[i];
            }
            return arr;
        },
        toUTF8: function (str) {
            return str.replace(/[^\x00-\xff]/g, function (a, b) {
                return '\\u' + ((b = a.charCodeAt()) < 16 ? '000' : b < 256 ? '00' : b < 4096 ? '0' : '') + b.toString(16)
            })
        },
        fromUTF8: function (str) {
            return str.replace(/\\u([0-9a-f]{3})([0-9a-f])/g, function (a, b, c) {
                return String.fromCharCode((parseInt(b, 16) * 16 + parseInt(c, 16)))
            })
        },
        urlEncode: function (hash) {
            var a = [], b = [], i, c, o;
            for (i in hash) {
                a[c = a.length] = b[b.length] = encodeURIComponent(i);
                if ((o = hash[i]) || o === 0) a[c] += '=' + encodeURIComponent(typeof o == 'string' ? o : xui.serialize(o));
            }
            a = xui.arr.stableSort(a, function (x, y, i, j) {
                return b[i] > b[j] ? 1 : b[i] == b[j] ? 0 : -1
            });
            return a.join('&');
        },
        urlDecode: function (str, key) {
            if (!str) return key ? '' : {};
            var arr, hash = {}, a = str.split('&'), o;
            for (var i = 0, l = a.length; i < l; i++) {
                o = a[i];
                arr = o.split('=');
                try {
                    hash[decodeURIComponent(arr[0])] = decodeURIComponent(arr[1] || '');
                } catch (e) {
                    hash[arr[0]] = arr[1] || '';
                }
            }
            return key ? hash[key] : hash;
        },
        getUrlParams: function (url) {
            return xui.urlDecode((url || location.href).replace(/^[^?]*[?!]+|^[^?]*$/, ''));
           // return xui.urlDecode((url || location.href).replace(/^[^#]*[#!]+|^[^#]*$/, ''));
        },
        preLoadImage: function (src, onSuccess, onFail) {
            if (xui.isArr(src)) {
                for (var i = 0, l = arr.length; i < l; i++)
                    xui.preLoadImage(src[i], onSuccess, onFail);
                return l;
            }
            var img = document.createElement("img");
            img.style.cssText = "position:absolute;left:-999px;top:-999px";
            img.width = img.height = 2;
            img.onload = function () {
                if (typeof onSuccess == 'function') onSuccess.call(this);
                this.onload = this.onerror = null;
                document.body.removeChild(this);
            };
            img.onerror = function () {
                if (typeof onFail == 'function') onFail.call(this);
                this.onload = this.onerror = null;
                document.body.removeChild(this);
            };
            document.body.appendChild(img);
            img.src = src;
            return 1;
        },
        // type detection
        isDefined: function (target) {
            return target !== undefined
        },
        isNull: function (target) {
            return target === null
        },
        isSet: function (target) {
            return target !== undefined && target !== null && target !== NaN
        },
        // including : object array function
        isObj: function (target) {
            return !!target && (typeof target == 'object' || typeof target == 'function')
        },
        isHash: function (target) {
            return !!target && _to.call(target) == '[object Object]' && target.constructor && /^\s*function\s+Object\(\s*\)/.test(target.constructor.toString()) && !Object.prototype.hasOwnProperty.call(target, "callee")
        },
        isBool: function (target) {
            return typeof target == 'boolean'
        },
        isNumb: function (target) {
            return typeof target == 'number' && isFinite(target)
        },
        isFinite: function (target) {
            return (target || target === 0) && isFinite(target) && !isNaN(parseFloat(target))
        },
        isDate: function (target) {
            return _to.call(target) === '[object Date]' && isFinite(+target)
        },
        isFun: function (target) {
            return _to.call(target) === '[object Function]'
        },
        isArr: function (target) {
            return _to.call(target) === '[object Array]'
        },
        isReg: function (target) {
            return _to.call(target) === '[object RegExp]'
        },
        isStr: function (target) {
            return _to.call(target) === '[object String]'
        },
        isArguments: function (target) {
            return target && (_to.call(target) === '[object Arguments]' || Object.prototype.hasOwnProperty.call(target, "callee"))
        },
        isEvent: function (target) {
            return target && ((/^(\[object (Keyboard|Mouse|Focus|Wheel|Composition|Storage)Event\])|(\[object Event\])$/.test(_to.call(target))) || (xui.isHash(target) && !!(target.$xuievent || target.$xuieventpara)))
        },
        isElem: function (target) {
            return !!(target && target.nodeType === 1)
        },
        isNaN: function (target) {
            return typeof target == 'number' && target != +target;
        },
        //for handling String
        str: {
            startWith: function (str, sStr) {
                return str.indexOf(sStr) === 0;
            },
            endWith: function (str, eStr) {
                var l = str.length - eStr.length;
                return l >= 0 && str.lastIndexOf(eStr) === l;
            },
            repeat: function (str, times) {
                return new Array(times + 1).join(str);
            },
            initial: function (str) {
                return str.charAt(0).toUpperCase() + str.substring(1);
            },
            trim: function (str) {
                return str ? str.replace(/^(\s|\uFEFF|\xA0)+|(\s|\uFEFF|\xA0)+$/g, '') : str;
            },
            ltrim: function (str) {
                return str ? str.replace(/^(\s|\uFEFF|\xA0)+/, '') : str;
            },
            rtrim: function (str) {
                return str ? str.replace(/(\s|\uFEFF|\xA0)+$/, '') : str;
            },
            /*
            blen : function(s){
                var _t=s.match(/[^\x00-\xff]/ig);
                return s.length+(null===_t?0:_t.length);
            },
            */
            //Dependencies: xui.Dom
            toDom: function (str) {
                var p = xui.$getGhostDiv(), r = [];
                p.innerHTML = str;
                for (var i = 0, t = p.childNodes, l = t.length; i < l; i++) r[r.length] = t[i];
                p = null;
                return xui(r);
            }
        },
        //for handling Array
        arr: {
            fastSortObject: function (arr, getKey) {
                if (!arr || arr.length < 2) return arr;

                var ll = arr.length,
                    zero = [],
                    len = (ll + "").length,
                    p = Object.prototype,
                    o, s, c, t;
                for (var i = 0; i < len; i++) zero[i] = new Array(len - i).join("0");
                for (var j = 0; j < ll; j++) {
                    s = j + '';
                    c = arr[j];
                    if (typeof c == "object") c._xui_$s$ = (xui.isSet(t = getKey.call(c, j)) ? t : '') + zero[s.length - 1] + s;
                }
                try {
                    o = p.toString;
                    p.toString = function () {
                        return this.hasOwnProperty('_xui_$s$') ? (this._xui_$s$) : (o.call(this));
                    };
                    arr.sort();
                } finally {
                    p.toString = o;
                    for (var j = 0; j < ll; j++) if (typeof arr[j] == "object") delete arr[j]._xui_$s$;
                }
                return arr;
            },
            stableSort: function (arr, sortby) {
                if (arr && arr.length > 1) {
                    for (var i = 0, l = arr.length, a = [], b = []; i < l; i++) b[i] = arr[a[i] = i];
                    if (xui.isFun(sortby))
                        a.sort(function (x, y) {
                            return sortby.call(arr, arr[x], arr[y], x, y) || (x > y ? 1 : -1);
                        });
                    else
                        a.sort(function (x, y) {
                            return arr[x] > arr[y] ? 1 : arr[x] < arr[y] ? -1 : x > y ? 1 : -1;
                        });
                    for (i = 0; i < l; i++) arr[i] = b[a[i]];
                    a.length = b.length = 0;
                }
                return arr;
            },
            subIndexOf: function (arr, key, value) {
                if (value === undefined) return -1;
                for (var i = 0, l = arr.length; i < l; i++)
                    if (arr[i] && arr[i][key] === value)
                        return i;
                return -1;
            },
            removeFrom: function (arr, index, length) {
                arr.splice(index, length || 1);
                return arr;
            },
            removeValue: function (arr, value) {
                for (var l = arr.length, i = l - 1; i >= 0; i--)
                    if (arr[i] === value)
                        arr.splice(i, 1);
                return arr;
            },
            intersection: function (a, b) {
                var ai = 0, bi = 0, result = [];
                while (ai < a.length && bi < b.length) {
                    if (a[ai] < b[bi]) ai++;
                    else if (a[ai] > b[bi]) bi++;
                    else {
                        result.push(a[ai]);
                        ai++;
                        bi++;
                    }
                }
                return result;
            },
            /*
             insert something to array
             arr: any
             index:default is length-1
             flag: is add array

             For example:
             insertAny([1,2],3)
                will return [1,2,3]
             insertAny([1,2],3,0)
                will return [3,1,2]
             insertAny([1,2],[3,4])
                will return [1,2,3,4]
             insertAny([1,2],[3,4],3,true)
                will return [1,2,[3,4]]
            */
            insertAny: function (arr, target, index, flag) {
                var l = arr.length;
                flag = (!xui.isArr(target)) || flag;
                if (index === 0) {
                    if (flag)
                        arr.unshift(target);
                    else
                        arr.unshift.apply(arr, target);
                } else {
                    var a;
                    if (!index || index < 0 || index > l) index = l;
                    if (index != l)
                        a = arr.splice(index, l - index);
                    if (flag)
                        arr[arr.length] = target;
                    else
                        arr.push.apply(arr, target);
                    if (a)
                        arr.push.apply(arr, a);
                }
                return index;
            },
            indexOf: function (arr, value) {
                for (var i = 0, l = arr.length; i < l; i++)
                    if (arr[i] === value)
                        return i;
                return -1;
            },
            /*
            fun: fun to apply
            desc: true - max to min , or min to max
            atarget: for this
            */
            each: function (arr, fun, scope, desc) {
                var i, l, a = arr;
                if (!a) return a;
                if (!xui.isArr(a)) {
                    if (!xui.isArr(a._nodes))
                        return a;
                    a = a._nodes;
                    if (desc === undefined)
                        desc = 1;
                }
                l = a.length;
                scope = scope || arr;
                if (!desc) {
                    for (i = 0; i < l; i++)
                        if (fun.call(scope, a[i], i, a) === false)
                            break;
                } else
                    for (i = l - 1; i >= 0; i--)
                        if (fun.call(scope, a[i], i, a) === false)
                            break;
                return arr;
            },
            removeDuplicate: function (arr, subKey) {
                var l = arr.length, a = arr.concat();
                arr.length = 0;
                for (var i = l - 1; i >= 0; i--) {
                    if (subKey ? this.subIndexOf(a, subKey, a[i][subKey]) === i : this.indexOf(a, a[i]) === i)
                        arr.push(a[i]);
                }
                return arr.reverse();
            }
        },
        _scope_set: function (dataMap) {
            if (window.get) xui._scope_bak = get;
            xui._scope_datamap = dataMap;
            window.get = function (key) {
                if (key) {
                    var t, i = (key = "" + key).indexOf("."), scope = i == -1 ? key : key.substr(0, i),
                        name = i == -1 ? null : key.substr(i + 1, key.length);
                    return (t = xui._scope_datamap) && (t = t[scope]) && (name ? t[name] : t);
                }
            };
        },
        _scope_clear: function (bak) {
            if (bak = xui._scope_bak) {
                window.get = bak;
                delete xui._scope_bak;
                delete xui._scope_datamap;
            }
        }
    });
};

xui.merge(xui.fun, {
    body: function (fun) {
        var s = "" + fun;
        s = s.replace(/(\s*\/\*[^*]*\*+([^\/][^*]*\*+)*\/)|(\s*\/\/[^\n]*)|(\)[\s\S]*)/g, function (a) {
            return a.charAt(0) != ")" ? "" : a
        });
        return s.slice(s.indexOf("{") + 1, s.lastIndexOf("}"));
    },
    args: function (fun) {
        var s = "" + fun;
        s = s.replace(/(\s*\/\*[^*]*\*+([^\/][^*]*\*+)*\/)|(\s*\/\/[^\n]*)|(\)[\s\S]*)/g, function (a) {
            return a.charAt(0) != ")" ? "" : a
        });
        s = s.slice(s.indexOf("(") + 1, s.indexOf(")")).split(/\s*,\s*/);
        return s[0] ? s : [];
    },
    clone: function (fun) {
        return new Function(xui.fun.args(fun), xui.fun.body(fun));
    }
});

xui.merge(xui.Class, {
    _reg: {$key: 1, $parent: 1, $children: 1, KEY: 1, Static: 1, Instance: 1, Constructor: 1, Initialize: 1},
    // give nodeType to avoid breakO
    _reg2: {
        'nodeType': 1,
        'constructor': 1,
        'prototype': 1,
        'toString': 1,
        'valueOf': 1,
        'hasOwnProperty': 1,
        'isPrototypeOf': 1,
        'propertyIsEnumerable': 1,
        'toLocaleString': 1
    },
    _all: [],
    /*envelop a function by some keys
    */
    _fun: function (fun, name, original, upper, type) {
        fun.$name$ = name;
        fun.$original$ = original;
        if (type) fun.$type$ = type;
        if (upper && fun !== upper) fun.upper = upper;
        return fun;
    },
    _other: ["toString", "valueOf"],
    /*envelop object's item from an object
    target: target object
    src: from object
     i: key in hash
    limit: envelop values in a hash
    */
    _o: {},
    //inherit from parents
    _inherit: function (target, src, instance) {
        var i, o, r = this._reg;
        for (i in src) {
            if (i in target || (!instance && r[i]) || i.charAt(0) == '$') continue;
            o = src[i];
            if (o && o.$xui$) continue;
            target[i] = o;
        }
    },
    //wrap
    _wrap: function (target, src, instance, parent, prtt) {
        var self = this, i, j, o, k = target.KEY, r = self._reg, r2 = self._reg2, f = self._fun, oo = self._other;
        for (i in src) {
            if (r2[i] || (!instance && r[i])) continue;
            o = src[i];
            target[i] = (typeof o != 'function') ? o : f(o, i, k, typeof parent[i] == 'function' && parent[i], prtt);
        }
        for (j = 0; i = oo[j++];) {
            o = src[i];
            if (o && (o == self._o[i])) continue;
            target[i] = (typeof o != 'function') ? o : f(o, i, k, typeof parent[i] == 'function' && parent[i], prtt);
        }
    },
    __gc: function (key) {
        var _c = xui.Class._all;
        if (!key) {
            for (var i = _c.length - 1; i > 0; i--)
                xui.Class.__gc(_c[i]);
            return;
        }
        if (typeof key == 'object') key = key.KEY || "";
        var t = xui.get(window, key.split('.')), s, i, j;
        if (t) {
            //remove from SC cache
            if (s = xui.get(window, ['xui', '$cache', 'SC'])) delete s[key];

            //remove parent link
            if (t.$parent)
                t.$parent.length = 0;

            //remove chidlren link
            //gc children
            if (s = t.$children) {
                //destroy children
                for (var i = 0, o; o = s[i]; i++)
                    if (o = xui.get(window, o.split('.')))
                        if (o.__gc)
                            o.__gc();
                s.length = 0;
            }

            //break function links
            for (i in t)
                if (i != 'upper' && typeof t[i] == 'function')
                    for (j in t[i])
                        if (t[i].hasOwnProperty(j))
                            delete t[i][j];
            xui.breakO(t);

            t = t.prototype;
            for (i in t)
                if (i != 'upper' && typeof t[i] == 'function')
                    for (j in t[i])
                        if (t[i].hasOwnProperty(j))
                            delete t[i][j];
            xui.breakO(t);

            //remove it out of window
            xui.set(window, key.split('.'));
        }

        _c.splice(_c[key], 1);
        delete _c[key];
    },
    destroy: function (key) {
        xui.Class.__gc(key)
    }
});

//function Dependencies: xui.Dom xui.Thread
xui.merge(xui, {
    version: 2.14,
    $DEFAULTHREF: 'javascript:;',
    $IEUNSELECTABLE: function () {
        return xui.browser.ie ? ' onselectstart="return false;" ' : ''
    },
    SERIALIZEMAXLAYER: 99,
    SERIALIZEMAXSIZE: 9999,

    $localeKey: 'en',
    $localeDomId: 'xlid',
    $dateFormat: '',
    $rand: "_rnd_",
    _rnd: function () {
        return xui.debugMode ? xui.$rand + "=" + xui.rand() : null;
    },
    _debugPre: function (arr) {
        arr = xui.toArr(arr);
        arr[0] = "%c [" + arr[0] + "@xui]";
        xui.arr.insertAny(arr, 'color:#0000ff; font-style: italic;', 1);
        return arr;
    },
    _debugInfo: function () {
        if (xui.debugMode && xui.isDefined(window.console) && typeof(console.log) == 'function') {
            console.log.apply(console, xui._debugPre(arguments));
        }
    },
    _debugGroup: function () {
        if (xui.debugMode && xui.isDefined(window.console) && typeof(console.group) == 'function') {
            console.group.apply(console, xui._debugPre(arguments));
        } else xui._debugInfo.apply(xui, arguments);
    },
    _debugGroupEnd: function () {
        if (xui.debugMode && xui.isDefined(window.console) && typeof(console.groupEnd) == 'function') {
            console.groupEnd();
        } else xui._debugInfo.apply(xui, arguments);
    },
    SpaceUnit: 'em',
    $us: function (p) {
        // ie67 always px
        return (xui.browser.ie6 || xui.browser.ie7) ? p ? -2 : -1 :
            (p = p ? (p._spaceUnit || (p.properties && p.properties.spaceUnit)) : '') == 'px' ? -2 : p == 'em' ? 2 :
                xui.SpaceUnit == 'px' ? -1 : xui.SpaceUnit == 'em' ? 1 : 0;
    },
    // for show xui.echo
    debugMode: true,

    Locale: {},
    constant: {},
    $cache: {
        thread: {},
        SC: {},
        clsByURI: {},
        fetching: {},
        hookKey: {},
        hookKeyUp: {},
        snipScript: {},

        subscribes: {},

        //ghost divs
        ghostDiv: [],
        data: {},
        callback: {},
        functions: {},
        //cache purge map for dom element
        domPurgeData: {},
        //cache DomProfile or UIProfile
        profileMap: {},
        //cache the reclaim serial id for UIProfile
        reclaimId: {},
        //cache built template for UIProfile
        template: {},
        //cache [key]=>[event handler] map for UIProfile
        UIKeyMapEvents: {},
        droppable: {},
        unique: {}
    },
    subscribe: function (topic, subscriber, receiver, asy) {
        if (topic === null || topic === undefined || subscriber === null || subscriber === undefined || typeof receiver != 'function') return;
        var c = xui.$cache.subscribes, i;
        c[topic] = c[topic] || [];
        i = xui.arr.subIndexOf(c[topic], "id", subscriber);
        if (i != -1) xui.arr.removeFrom(c[topic], i);
        return c[topic].push({id: subscriber, receiver: receiver, asy: !!asy});
    },
    unsubscribe: function (topic, subscriber) {
        var c = xui.$cache.subscribes, i;
        if (!subscriber) {
            if (topic === null || topic === undefined)
                c = {};
            else
                delete c[topic];
        } else if (c[topic]) {
            i = xui.arr.subIndexOf(c[topic], "id", subscriber);
            if (i != -1) xui.arr.removeFrom(c[topic], i);
        }
    },
    publish: function (topic, args, subscribers, scope) {
        var c = xui.$cache.subscribes;
        if (topic === null || topic === undefined) {
            for (var topic in c) {
                xui.arr.each(c[topic], function (o) {
                    if (!subscribers || subscribers === o.id || (xui.isArr(subscribers) && xui.arr.indexOf(subscribers, o.id) != -1)) {
                        if (o.asy)
                            xui.asyRun(o.receiver, 0, args, scope);
                        else
                            return xui.tryF(o.receiver, args, scope, true);
                    }
                });
            }
        } else if (c[topic]) {
            xui.arr.each(c[topic], function (o) {
                if (!subscribers || subscribers === o.id || (xui.isArr(subscribers) && xui.arr.indexOf(subscribers, o.id) != -1)) {
                    if (o.asy)
                        xui.asyRun(o.receiver, 0, args, scope);
                    else
                        return xui.tryF(o.receiver, args, scope, true);
                }
            });
        }
    },
    getSubscribers: function (topic) {
        return (topic === null || topic === undefined) ? xui.$cache.subscribes : xui.$cache.subscribes[topic];
    },

    setDateFormat: function (format) {
        xui.$dateFormat = format
    },
    getDateFormat: function (format) {
        return format || xui.$dateFormat || xui.$cache.data.$DATE_FORMAT
    },

    setAppLangKey: function (key) {
        xui.$appLangKey = key
    },
    getAppLangKey: function (key) {
        return xui.$appLangKey
    },
    getLang: function () {
        return xui.$localeKey
    },
    setLang: function (key, onOK, callback) {
        var g = xui.getRes, t, v, i, j, f, m, z, a = [], l;
        xui.$localeKey = key;
        v = document.getElementsByTagName ? document.getElementsByTagName('span') : document.all && document.all.tags ? document.all.tags('span') : null;
        if (!v) return;
        for (i = 0; t = v[i]; i++) if (t.id == xui.$localeDomId) a[a.length] = t;
        l = a.length;
        f = function () {
            var ff = function () {
                j = a.splice(0, 100);
                for (i = 0; t = j[i]; i++)
                    if (t.className && typeof(v = g(t.className)) == 'string')
                        t.innerHTML = v;
                if (a.length)
                    xui.setTimeout(ff, 0);
                xui.tryF(callback, [a.length, l]);
                if (!a.length)
                    xui.tryF(onOK, [0, l]);
            };
            ff();
        },
            z = 'xui.Locale.' + key,
            m = function () {
                var k = xui.$appLangKey;
                if (k) xui.include(z + '.' + k, xui.getPath('xui.Locale.' + key, '.js'), f, f);
                else f();
            };
        // use special key to invoid other lang setting was loaded first
        xui.include(z + '.inline.$_$', xui.getPath(z, '.js'), m, m);
    },
    getTheme: function (a) {
        try {
            a = xui.CSS.$getCSSValue('.setting-uikey', 'fontFamily');
        } catch (e) {
        } finally {
            return a || "default";
        }
    },
    setTheme: function (key, refresh, onSucess, onFail, tag) {
        key = key || 'default';
        var okey = xui.getTheme();
        if (key != okey) {
            var onend = function (onSucess) {
                if (okey != 'default') {
                    var style;
                    while (style = xui.CSS.$getCSSValue('.setting-uikey', 'fontFamily', okey)) {
                        style.disabled = true;
                        style.parentNode.removeChild(style);
                        style = null;
                    }
                }
                if (refresh !== false)
                    xui.CSS.adjustFont();
                xui.tryF(onSucess);
            };
            if (key == 'default') {
                onend(onSucess);
            } else {
                try {
                    var tkey = xui.CSS.$getCSSValue('.setting-uikey', 'fontFamily');
                } catch (e) {
                } finally {
                    if (tkey == key) {
                        xui.tryF(onSucess);
                        return;
                    } else {
                        var id = 'theme:' + key,
                            path = xui.getPath('xui.appearance.' + key, '');
                        if (tag) {
                            xui.getFileAsync(path + 'theme.css', function (rsp) {
                                rsp = xui.replace(rsp, [
                                    [/(\/\*[^*]*\*+([^\/][^*]*\*+)*\/)/, '$0'],
                                    [/\{[^}]*\}/, '$0'],
                                    [/([^\/{},]+)/, function (a) {
                                        // protect '.setting-uikey'
                                        return xui.str.endWith(a[0], '.setting-uikey') ? a[0] : a[0].replace(/([^\s>]+)/, "$1" + tag)
                                    }]
                                ]);
                                rsp = rsp.replace(/url\(([^)]+)\)/g, "url(" + path + "$1)");
                                xui.CSS._appendSS(xui('head'), rsp, id, false);
                            });
                        } else
                            xui.CSS.includeLink(path + 'theme.css', id);
                    }
                    var count = 0, fun = function () {
                        // timeout: 21 seconds
                        if (count++ > 20) {
                            fun = count = null;
                            if (false !== xui.tryF(onFail))
                                throw 'errLoadTheme:' + key;
                            return;
                        }
                        //test
                        try {
                            var tkey = xui.CSS.$getCSSValue('.setting-uikey', 'fontFamily');
                        } catch (e) {
                        } finally {
                            if (tkey == key) {
                                onend(onSucess);
                                fun = count = null;
                            } else {
                                xui.asyRun(fun, 100 * count);
                            }
                        }
                    };
                    fun();
                }
            }
        } else {
            xui.tryF(onSucess);
        }
    },
    reLayout: function () {
        if (xui.UI) xui.UI.getAll().reLayout(true);
    },
    _langParamReg: /\x24(\d+)/g,
    _langscMark: /[$@{][\S]+/,
    // locale  pattern  :  $*  $a  $a.b.c  $(a.b.c- d)
    // variable pattern: @a.b.c@  @a@  {!}  {a.b.c}
    _langReg: /((\$)([^\w\(]))|((\$)([\w][\w\.-]*[\w]+))|((\$)\(([\w][\w\.]*[^)\n\r]+))\)|((\$)([^\s]))|((\@)([\w][\w\.]*[\w]+)(\@?))|((\@)([^\s])(\@?))|((\{)([~!@#$%^&*+-\/?.|:][\w\[\]]*|[\w\[\]]+(\(\))?(\.[\w\[\]]+(\(\))?)*)(\}))/g,
    _escapeMap: {
        "$": "\x01",
        ".": "\x02",
        "-": "\x03",
        ")": "\x04",
        "@": "\x05"
    },
    _unescapeMap: {
        "\x01": "$",
        "\x02": ".",
        "\x03": "-",
        "\x04": ")",
        "\x05": "@"
    },
    //test1: xui.getRes("start.a.b.c $0 $1 ($- $. $$) end-1-2")  => "c 1 2 (- . $) end"
    //tset2: xui.getRes( ["a","b","c $0 $1 ($- $. $$) end"],1,2) => "c 1 2 (- . $) end"
    getRes: function (path) {
        var arr, conf, tmp, params = arguments, rtn;
        if (xui.isStr(path)) {
            path = path.replace(/\$([$.-])/g, function (a, b) {
                return xui._escapeMap[b] || a;
            });
            if (path.charAt(0) == '$') path = path.slice(1);
            if (path.indexOf('-') != -1) {
                tmp = path.split('-');
                path = tmp[0];
                params = tmp;
            } else if (xui.isArr(params[1])) {
                params = params[1];
                params.unshift(path);
            }
            arr = path.split(".");
            arr[arr.length - 1] = arr[arr.length - 1].replace(/([\x01\x02\x03\x04])/g, function (a) {
                return xui._unescapeMap[a];
            });
        } else if (xui.isArr(path)) {
            arr = path;
        } else {
            return path;
        }
        conf = xui.get(xui.Locale[xui.$localeKey], arr);
        if ((tmp = typeof conf) == 'function') {
            return conf.apply(null, params);
        } else if (tmp == 'object') {
            return conf;
        } else {
            conf = tmp == 'string' ? conf.replace(/\$([$.-])/g, function (a, b) {
                return xui._escapeMap[b] || a;
            }) : arr[arr.length - 1];
            rtn = params.length > 1 ? conf.replace(xui._langParamReg, function (z, id, k) {
                k = params[1 + +id];
                return (k === null || k === undefined) ? z : k
            }) : conf;
            return rtn.replace(/([\x01\x02\x03])/g, function (a) {
                return xui._unescapeMap[a];
            });
        }
    },
    wrapRes: function (id) {
        if (!xui.isStr(id)) return id;
        var i = id, s, r;
        if (i.charAt(0) == '$') arguments[0] = i.substr(1, i.length - 1);
        s = id;
        r = xui.getRes.apply(null, arguments);
        if (s == r) r = i;
        return '<span id="' + xui.$localeDomId + '" class="' + s.replace(/([\x01\x02\x03\x04])/g, function (a) {
            return '$' + xui._unescapeMap[a];
        }) + '" ' + xui.$IEUNSELECTABLE() + '>' + r + '</span>';
    },
    //test1: xui.adjustRes("$(start.a.b.c $0 $1 ($- $. $$$) end-1-2)"); => "c 1 2 (- . $) end"
    adjustRes: function (str, wrap, onlyBraces, onlyVars, params, scope1, scope2) {
        if (!xui.isStr(str)) return str;
        wrap = wrap ? xui.wrapRes : xui.getRes;
        str = str.replace(/\$([\$\.\-\)])/g, function (a, b) {
            return xui._escapeMap[b] || a;
        });
        str = xui._langscMark.test(str) ? str.replace(xui._langReg, function (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z) {
            // protect $@{
            return c == '$' ? onlyVars ? a : d :
                // $a.b.c-1-3
                f == '$' ? onlyVars ? a : wrap(g, params) :
                    // $(a.b.c-d)
                    i == '$' ? onlyVars ? a : wrap(j, params) :
                        // $a
                        l == '$' ? onlyVars ? a : wrap(m, params) :
                            // variable: @a@ @a.b.c@ {a.b.c}
                            ((onlyBraces ? 0 : (o == '@' || s == '@')) || w == "{") ? ((z = xui.SC.get(o == "@" ? p : s == "@" ? t : x, scope1, scope2)) || (xui.isSet(z) ? z : ""))
                                : a;
        }) : str;
        return str.replace(/([\x01\x02\x03\x04])/g, function (a) {
            return xui._unescapeMap[a];
        });
    },
    adjustVar: function (obj, scope1, scope2) {
        var t;
        return typeof(obj) == "string" ?
            obj == "{[]}" ? [] :
                obj == "{{}}" ? {} :
                    obj == "{}" ? "" :
                        obj == "{true}" ? true :
                            obj == "{false}" ? false :
                                obj == "{NaN}" ? NaN :
                                    obj == "{null}" ? null :
                                        obj == "{undefined}" ? undefined :
                                            obj == "{now}" ? new Date() :
                                                (t = /^\s*\{((-?\d\d*\.\d*)|(-?\d\d*)|(-?\.\d\d*))\}\s*$/.exec(obj)) ? parseFloat(t[1]) :
                                                    // {a.b(3,"a")}
                                                    // scope allows hash only
                                                    (t = /^\s*\{([\w\.]+\([^)]*\))\s*\}\s*$/.exec(obj)) && (scope1 || scope2) && xui.isHash(scope1 || scope2) ? (new Function("try{return this." + t[1] + "}catch(e){}")).call(scope1 || scope2) :
                                                        //{a.b.c} or {prf.boxing().getValue()}
                                                        (t = /^\s*\{([^}]+)\}\s*$/.exec(obj)) ?
                                                            xui.SC.get(t[1], scope1, scope2)
                                                            : xui.adjustRes(obj, false, true, true, null, scope1, scope2)
            : obj;
    },
    _getrpc: function (uri, query, options) {
        var t = (options && options.proxyType) ? options.proxyType.toLowerCase() : "";

        return (t == "sajax" || t == "jsonp") ? xui.JSONP
            : (t == "iajax" || t == "xdmi") ? xui.XDMI
                : (t == "ajax") ? xui.Ajax
                    // include a file => XDMI
                    : (typeof query == 'object' && ((function (d) {
                        if (!xui.isHash(d)) return 0;
                        for (var i in d) if ((d[i] && d[i].nodeType == 1 && d[i].nodeName == "INPUT") || (d[i] && d[i].$xuiFileCtrl)) return 1
                    })(query))) ? xui.XDMI
                        // post: crossdomain => XDMI, else Ajax
                        : (options && options.method && options.method.toLowerCase() == 'post') ? xui.absIO.isCrossDomain(uri) ? xui.XDMI : xui.Ajax
                            // get : crossdomain => JSONP, else Ajax
                            : xui.absIO.isCrossDomain(uri) ? xui.JSONP : xui.Ajax;
    },
    request: function (uri, query, onSuccess, onFail, threadid, options) {
        return xui._getrpc(uri, query, options).apply(null, arguments).start();
    },
    ajax: function (uri, query, onSuccess, onFail, threadid, options) {
        return xui.Ajax.apply(null, arguments).start();
    },
    jsonp: function (uri, query, onSuccess, onFail, threadid, options) {
        return xui.JSONP.apply(null, arguments).start();
    },
    xdmi: function (uri, query, onSuccess, onFail, threadid, options) {
        return xui.XDMI.apply(null, arguments).start();
    },
    restGet: function (uri, query, onSuccess, onFail, threadid, options) {
        if (!options) options = {};
        options.method = "get";
        return xui.Ajax(uri, query, onSuccess, onFail, threadid, options).start();
    },
    restPost: function (uri, query, onSuccess, onFail, threadid, options) {
        if (!options) options = {};
        options.method = "post";
        return xui.Ajax(uri, query, onSuccess, onFail, threadid, options).start();
    },
    restPut: function (uri, query, onSuccess, onFail, threadid, options) {
        if (!options) options = {};
        options.method = "put";
        return xui.Ajax(uri, query, onSuccess, onFail, threadid, options).start();
    },
    restDelete: function (uri, query, onSuccess, onFail, threadid, options) {
        if (!options) options = {};
        options.method = "delete";
        return xui.Ajax(uri, query, onSuccess, onFail, threadid, options).start();
    },
    getFileSync: function (uri, onSuccess, onFail, options) {
        return xui.Ajax(uri, options && options.force ? xui._rnd() : null, onSuccess, onFail, null, xui.merge({
            asy: false,
            rspType: options && options.rspType || "text"
        }, options, 'without')).start() || null;
    },
    getFileAsync: function (uri, onSuccess, onFail, threadid, options) {
        xui.Ajax(uri, options && options.force ? xui._rnd() : null, onSuccess, onFail, threadid, xui.merge({
            asy: true,
            rspType: options && options.rspType || "text"
        }, options, 'without')).start();
    },
    include: function (id, path, onSuccess, onFail, sync, options) {
        if (id && xui.SC.get(id))
            xui.tryF(onSuccess);
        else {
            options = options || {};
            var rnd = options.force ? xui._rnd() : null;
            options.rspType = 'script';
            if (!sync) {
                options.checkKey = id;
                xui.JSONP(path, rnd, onSuccess, onFail, 0, options).start()
            } else {
                options.asy = !sync;
                xui.Ajax(path, rnd, function (rsp) {
                    try {
                        xui.exec(rsp, id)
                    }
                    catch (e) {
                        xui.tryF(onFail, [e.name + ": " + e.message])
                    }
                    xui.tryF(onSuccess);
                }, onFail, 0, options).start();
            }
        }
    },
    mailTo: function (email, subject, body, cc, bcc) {
        if (xui.isHash(subject)) {
            bcc = subject.bcc || "";
            cc = subject.cc || "";
            body = subject.body || "";
            subject = subject.subject || "";
        }
        var url = 'mailto:' + email +
            '?subject=' + encodeURIComponent(xui.adjustRes(subject || ""))
            + '&body= ' + encodeURIComponent(xui.adjustRes(body || ""))
            + '&cc= ' + (cc || "")
            + '&bcc= ' + (bcc || "");
        xui.XDMI(url).start();
    },
    fetchClass: function (uri, onSuccess, onFail, onAlert, force, threadid, options) {
        options = options || {};
        var isPath = options.uri || /\//.test(uri) || /\.js$/i.test(uri),
            c = xui.$cache.clsByURI,
            onFetching = xui.$cache.fetching,
            clearFetching = function () {
                for (var i in onFetching[uri][3]) xui.Thread.abort(onFetching[uri][3][i]);
                if (onFetching[uri]) {
                    onFetching[uri][0].length = 0;
                    onFetching[uri][1].length = 0;
                    onFetching[uri][2].length = 0;
                    onFetching[uri][3].length = 0;
                    onFetching[uri].length = 0;
                    delete onFetching[uri];
                }
                onFetching = null;
            },
            rnd = options.force ? xui._rnd() : null,
            cls, obj;
        if (isPath) {
            cls = xui.getClassName(uri);
            if (cls && xui.SC.get(cls))
                isPath = false;
        } else {
            // special path( dont use any dynamic
            if (!options.hasOwnProperty('appPath') && window["/"]) options.appPath = window["/"];
            cls = uri;
            //   uri=xui.getPath(uri,'.js','js',options);
            uri = xui.getPath(uri, '.js', '', options);
        }
        if (!force && (isPath ? ((obj = c[uri]) && obj.$xui$) : (obj = xui.SC.get(cls))))
            xui.tryF(onSuccess, [uri, cls], obj);
        else {
            // For fetching one class multiple times
            if (!onFetching[uri]) {
                onFetching[uri] = [onSuccess = onSuccess ? [onSuccess] : [], onFail = onFail ? [onFail] : [], onAlert = onAlert ? [onAlert] : [], []];
                if (!cls || (options && options.crossDomain) || xui.absIO.isCrossDomain(uri)) {
                    if (cls) {
                        xui.Class._ignoreNSCache = 1;
                        xui.Class._last = null;
                    }
                    xui.JSONP(uri, rnd, function () {
                        if (cls) {
                            if (xui.Class._last) obj = c[uri] = xui.Class._last;
                            xui.Class._ignoreNSCache = xui.Class._last = null;
                            if (obj) {
                                for (var i = 0, l = onSuccess.length; i < l; i++) xui.tryF(onSuccess[i], [uri, obj.KEY], obj);
                            }
                            else {
                                for (var i = 0, l = onFail.length; i < l; i++) xui.tryF(onFail[i], xui.toArr(arguments));
                            }
                            var s = xui.getClassName(uri, options.appPath);
                            // if(obj&&s&&obj.KEY!=s){
                            //     var msg="[xui] > The last class name in '"+uri+"' should be '"+s+"', but it's '"+obj.KEY+"'!";
                            //     for(var i=0,l=onAlert.length;i<l;i++)xui.tryF(onAlert[i], [msg, uri, s, obj.KEY]);
                            //     xui.log( msg );
                            // }
                        } else {
                            for (var i = 0, l = onSuccess.length; i < l; i++) xui.tryF(onSuccess[i], [uri]);
                        }
                        // for Thread.group in fetchClasses
                        clearFetching();
                    }, function () {
                        if (cls) {
                            xui.Class._ignoreNSCache = 1;
                            xui.Class._last = null;
                        }
                        for (var i = 0, l = onFail.length; i < l; i++) xui.tryF(onFail[i], xui.toArr(arguments));
                        // for Thread.group in fetchClasses
                        clearFetching();
                    }, threadid, {rspType: 'script'}).start();
                } else {
                    xui.Ajax(uri, rnd, function (rsp) {
                        xui.Class._ignoreNSCache = 1;
                        xui.Class._last = null;
                        var scriptnode;
                        var s = xui.getClassName(uri, options.appPath);
                        try {
                            scriptnode = xui.exec(rsp, s)
                        } catch (e) {
                            for (var i = 0, l = onFail.length; i < l; i++) xui.tryF(onFail[i], [e.name + ": " + e.message]);
                            xui.Class._last = null;
                        }
                        if (xui.Class._last) obj = c[uri] = xui.Class._last;
                        xui.Class._ignoreNSCache = xui.Class._last = null;
                        if (obj) {
                            for (var i = 0, l = onSuccess.length; i < l; i++) xui.tryF(onSuccess[i], [uri, obj.KEY], obj);
                        }
                        else {
                            for (var i = 0, l = onFail.length; i < l; i++) xui.tryF(onFail[i], xui.toArr(arguments));
                        }
                        // if(obj&&obj.KEY!=s){
                        //     var msg="[xui] > The last class name in '"+uri+"' should be '"+s+"', but it's '"+obj.KEY+"'!";
                        //     for(var i=0,l=onAlert.length;i<l;i++)xui.tryF(onAlert[i], [msg, uri, s,  obj.KEY]);
                        //     xui.log( msg );
                        // }
                        // for Thread.group in fetchClasses
                        clearFetching();
                    }, function () {
                        xui.Class._ignoreNSCache = xui.Class._last = null;
                        for (var i = 0, l = onFail.length; i < l; i++) xui.tryF(onFail[i], xui.toArr(arguments));
                        // for Thread.group in fetchClasses
                        clearFetching();
                    }, threadid, {rspType: 'text', asy: true}).start();
                }
            } else {
                if (onSuccess) onFetching[uri][0].push(onSuccess);
                if (onFail) onFetching[uri][1].push(onFail);
                if (onAlert) onFetching[uri][2].push(onAlert);
                if (threadid) {
                    onFetching[uri][3].push(threadid);
                    xui.Thread.suspend(threadid);
                }
            }
        }
    },
    fetchClasses: function (uris, onEnd, onSuccess, onFail, onAlert, force, threadid, options) {
        var hash = {}, f = function (uri, i, hash) {
            hash[i] = xui.Thread(null, [function (tid) {
                if (uri){
                    xui.fetchClass(uri, onSuccess, onFail, onAlert, force, tid, options);
                }

            }]);
        };
        for (var i = 0, l = uris.length; i < l; i++) f(uris[i], i, hash);
        return xui.Thread.group(null, hash, null, function () {
            xui.Thread.suspend(threadid);
        }, function () {
            xui.tryF(onEnd, arguments, this);
            xui.Thread.resume(threadid);
        }).start();
    },
    // Recursive require
    require: function (clsArr, onEnd, onSuccess, onFail, onAlert, force, threadid, options) {
        if (xui.isStr(clsArr)) clsArr = [clsArr];
        var fun = function (paths, tid) {
            xui.fetchClasses(paths, function () {
                var a2 = [], obj, r;
                for (var i = 0, l = paths.length; i < l; i++) {
                    obj = xui.SC.get(paths[i]);
                    //collect  required class
                    if (obj && (r = obj.Required) && r.length) {
                        for (var j = 0, m = r.length; j < m; j++) {
                            if (!xui.SC.get(r[j])) a2.push(r[j]);
                        }
                    }
                    // if it's module, collect required class in iniComponents
                    if (obj && obj['xui.Module'] && (obj = obj.prototype && obj.prototype.iniComponents)) {
                        xui.fun.body(obj).replace(/\bxui.create\s*\(\s*['"]([\w.]+)['"]\s*[,)]/g, function (a, b) {
                            if (!(a = xui.SC.get(b))) {
                                a2.push(b);
                                a = null;
                            }
                            // if(force && a && a['xui.Module']){
                            //     a2.push(b);
                            // }
                        });
                    }
                }
                if (a2.length) {
                    fun(a2, null);
                } else {
                    var arr = [];
                    for (var i = 0, l = clsArr.length; i < l; i++) {
                        arr.push(xui.SC.get(clsArr[i]));
                    }
                    if (onEnd) onEnd.apply(null, arr);
                }
            }, onSuccess, onFail, onAlert, force, tid, options);
        };
        fun(clsArr, threadid);
    },
    /*
    set application main function
    example:
        xui.main(function(){
            ...
        });
    */
    _m: [],
    main: function (fun) {
        if (xui.arr.indexOf(xui._m, fun) == -1)
            xui._m.push(fun);
        // run it now
        if (xui.isDomReady) {
            xui._domReadyFuns();
        }
    },
    /*
    key: xui.UI.xxx
    tag: file tag
    add: appearance or bahavior
    example:
        xui.getPath('xui.UI.Button','','appearance') => xui.ini.path + /appearance/UI/Button/
        xui.getPath('xui.UI.Button','.gif','appearance') => xui.ini.path + /appearance/UI/Button.gif
        xui.getPath('a.b','','appearance') => xui.ini.appPath + /a/appearance/b/"
        xui.getPath('a.b','.gif','appearance') => xui.ini.appPath + /a/appearance/b.gif"
    */
    getPath: function (key, tag, folder, options) {
        if (!key){
            return tag;
        }

        if (tag == '.cls') {
            key = key.split('.');
            key = key.splice(0, key.length - 1);
            return key.join('\/') + '.cls';
        }


        if (key.indexOf('xui.appearance.') == 0) {
            key = key.split('.');
            return "/RAD/" + key.join('\/') + "/";
        }
        if (key.indexOf('xui.Locale.') == 0) {
            key = key.split('.');
            return "/RAD/" + key.join('\/') + ".js";
        }

        if (key.indexOf('root.') == 0) {
            key = key.split('.');
            return "/" + key.join('\/') + '.js';
        }

        if (key.indexOf('custom.') == 0) {
            key = key.split('.');
            return "" + key.join('\/') + '.cls';
        }

        if (xui.str.startWith(key, 'RAD.')) {
            key = key.split('.');
            return "/RAD/" + key.join('\/') + '.js';
        }

        if (xui.str.startWith(key, '/RAD/')) {
            return key + tag;
        }

        key = key.split('.');
        if (folder) {
            var a = [key[0], folder];
            for (var i = 1, l = key.length; i < l; i++)
                a.push(key[i]);
            key.length = 0;
            key = a;
        }

        var pre, ini = xui.ini, t,
            ensureTag = function (s) {
                return s && s.slice(-1) != "/" ? s + "/" : s;
            };
        if (key[0] == 'xui') {
            key.shift();
            if (key.length == (folder ? 1 : 0)) key.push('xui');

            pre = ensureTag((options && options.xuiPath) || ini.path);
        } else {
            if (key.length == ((folder ? 1 : 0) + 1) && tag == '.js') key.push('index');

            if (pre = ensureTag(options && options.appPath)) {
                if (t = (options && options.verPath)) pre += ensureTag(t);
                if (t = (options && options.ver)) pre += ensureTag(t);
            } else if (pre = ensureTag(ini.appPath)) {
                if (t = ini.verPath) pre += ensureTag(t);
                if (t = ini.ver) pre += ensureTag(t);
            }
        }
        return key.join('\/') + (tag || '\/');

        // return pre + key.join('\/') + (tag || '\/');
    },
    getClassName: function (uri, appPath) {
        if (uri && xui.isStr(uri)) {
            // var a=uri.split(/\/js\//g),
            //     b,c,n=a.length;
            // if(n>=2){
            //     // get the last one: any/js/any/App/js/index.js
            //     b=a[n-2].split(/\//g);
            //     b=b[b.length-1];
            //     a=a[n-1].replace(/\.js$/i,"");
            //     return (b+(a?".":"")+a.replace(/\//g,".")).replace(/^([^.]+)\.index$/,'$1');
            // }
            //直接返回绝对路径


            if (appPath) {
                uri = uri.replace(appPath + "/", "")
            }
            return uri.replace(/\//g, ".").replace(/\.js$/i, "").replace(/\.vv$/i, "").replace(/\.cls$/i, "").replace();
            // return uri.replace(/\//g,".").replace(/\.js$/i,"");
        }
    },
    log: xui.fun(),
    echo: xui.fun(),
    message: xui.fun(),

    //profile object cache
    _pool: [],
    getObject: function (id) {
        return xui._pool['$' + id]
    },
    getObjectByAlias: function (alias) {
        var o, a = [], l = 0;
        for (var i in xui._pool) {
            o = xui._pool[i];
            if (('alias' in o) && o.alias === alias) {
                a.push(o);
                l++;
            }
        }
        return l === 0 ? null : l === 1 ? a[0] : a;
    },
    _ghostDivId: "xui.ghost::",
    $getGhostDiv: function () {
        var pool = xui.$cache.ghostDiv,
            i = 0, l = pool.length, p;
        do {
            p = pool[i++]
        } while (i < l && (p && p.firstChild))
        if (!p || p.firstChild) {
            p = document.createElement('div');
            p.id = xui._ghostDivId;
            pool.push(p);
        }
        return p;
    },
    //for handling dom element
    $xid: 0,
    $registerNode: function (o) {
        //get id from cache or id
        var id, v, purge = xui.$cache.domPurgeData;
        if (!(o.$xid && (v = purge[o.$xid]) && v.element == o)) {
            id = '!' + xui.$xid++;
            v = purge[id] || (purge[id] = {});
            v.element = o;
            o.$xid = v.$xid = id;
        }
        o = null;
        return v;
    },
    getId: function (node) {
        if (typeof node == 'string') node = document.getElementById(node);
        return node ? window === node ? "!window" : document === node ? "!document" : (node.$xid || '') : '';
    },
    getNode: function (xid) {
        return xui.use(xid).get(0);
    },
    getNodeData: function (node, path) {
        if (!node) return;
        return xui.get(xui.$cache.domPurgeData[typeof node == 'string' ? node : xui.getId(node)], path);
    },
    setData: function (path, value) {
        return xui.set(xui.$cache.data, path, value);
    },
    getData: function (path) {
        return xui.get(xui.$cache.data, path);
    },
    setNodeData: function (node, path, value) {
        if (!node) return;
        return xui.set(xui.$cache.domPurgeData[typeof node == 'string' ? node : xui.getId(node)], path, value);
    },
    $purgeChildren: function (node) {
        var cache = xui.$cache,
            proMap = cache.profileMap,
            ch = cache.UIKeyMapEvents,
            pdata = cache.domPurgeData,
            event = xui.Event,
            handler = event.$eventhandler,
            handler3 = event.$eventhandler3,
            // ie<=10
            children = (xui.browser.ie && node.all) ? node.all : node.getElementsByTagName('*'),
            l = children.length,
            bak = [],
            i, j, o, t, v, w, id;
        for (i = 0; i < l; i++) {
            if (!(v = children[i])) continue;
            if (t = v.$xid) {
                if (o = pdata[t]) {

                    //clear event handler
                    if (w = o.eHandlers) {
                        if (xui.browser.isTouch && w['onxuitouchdown'])
                            event._removeEventListener(v, "xuitouchdown", handler);
                        for (j in w) {
                            event._removeEventListener(v, j, handler);
                            event._removeEventListener(v, j, handler3);
                        }
                    }
                    for (j in o)
                        o[j] = null;

                    delete pdata[t];
                }

                //remove the only var in dom element
                if (xui.browser.ie)
                    v.removeAttribute('$xid');
                else
                    delete v.$xid;
            }

            if (id = v.id) {
                //clear dom cache
                //trigger object __gc
                if (id in proMap) {
                    o = proMap[id];
                    if (!o) continue;
                    t = o.renderId;
                    if ('!window' === t || '!document' === t) continue;

                    //don't trigger any innerHTML or removeChild in __gc()
                    o.__gc(true, true);
                    //clear the cache
                    bak[bak.length] = id;
                    //clear the cache shadow
                    if (o.$domId && o.$domId != o.domId)
                        bak[bak.length] = o.$domId;
                }
            }
        }
        //clear dom cache
        for (i = 0; i < bak.length;)
            delete proMap[bak[i++]];
        //clear dom content
        //1)while(node.firstChild)
        //   node.removeChild(node.firstChild);
        //2) node.innerHTML='';
        //3) the best one: remove first level by removeChild desc
        for (i = node.childNodes.length - 1; i >= 0; i--)
            node.removeChild(node.childNodes[i]);
    },

    //create:function(tag, properties, events, host){
    create: function (tag, bak) {
        var arr, o, t, r1 = /</;
        if (xui.isArr(tag)) {
            arr = [];
            for (var i = 0, l = tag.length; i < l; i++) Array.prototype.push.apply(arr, xui.create(tag[i]).get());
            return xui(arr);
        } else if (typeof tag == 'string') {
            //Any class inherited from xui.absBox
            if (t = xui.absBox.$type[tag]) {
                arr = [];
                //shift will crash in opera
                for (var i = 1, l = arguments.length; i < l; i++)
                    arr[i - 1] = arguments[i];
                o = new (xui.SC(t))(false);
                if (o._ini) o._ini.apply(o, arr);
            } else if (((t = xui.SC.get(tag)) && t["xui.Module"]) || bak == "xui.Module") {
                if (t) {
                    o = new t();
                    // use place holder to lazy bind
                } else {
                    o = new xui.UI.MoudluePlaceHolder();
                    xui.require(tag, function (module) {
                        if (module && module["xui.Module"]) {
                            var t = o.get(0);
                            if (t) {
                                if (t.renderId) {
                                    var m = new module();
                                    m.create(function () {
                                        o.replaceWithModule(m);
                                    });
                                } else {
                                    t._module = new module();
                                }
                            }
                        }
                    });
                }
                //from HTML element tagName
            } else if (/^[\w-]+$/.test(tag)) {
                o = document.createElement(tag);
                o.id = typeof id == 'string' ? id : xui.id();
                o = xui(o);
                //from HTML string
            } else {
                if (r1.test(tag))
                    o = xui.str.toDom(tag);
                if (!(o && o.n0))
                    o = xui.str.toDom("<xui>" + tag + "</xui>");
            }
            //Any class inherited from xui.absBox
        } else {
            if (tag['xui.Module']) {
                if ((t = xui.SC.get(tag.key)) && t["xui.Module"]) {
                    o = new t(tag);
                    // use place holder to lazy bind
                } else {
                    o = new xui.UI.MoudluePlaceHolder();
                    if (t = tag.events) o.setEvents(t);
                    if (t = tag.properties) o.setProperties(t);

                    if (tag.moduleClass && tag.moduleXid) {
                        o.get(0).moduleClass = tag.moduleClass;
                        o.get(0).moduleXid = tag.moduleXid;
                    }
                    xui.require(tag.key, function (module) {
                        if (module && module["xui.Module"]) {
                            var m = new module(tag);
                            m.create(function () {
                                o.replaceWithModule(m);
                            });
                        }
                    });
                }
            } else {
                o = new (xui.SC(tag.key))(tag);
            }
        }
        if (o['xui.absObj'] && (t = o.n0) && (t.host && t.host != t) && t.alias) o.setHost(t.host, t.alias);
        return o;
    },
    query: function () {
        return xui.doc.query.apply(xui.doc, arguments);
    },
    querySelector: function () {
        return xui.doc.querySelector.apply(xui.doc, arguments);
    },
    querySelectorAll: function () {
        return xui.doc.querySelectorAll.apply(xui.doc, arguments);
    },
    use: function (xid) {
        var c = xui._tempBox || (xui._tempBox = xui()), n = c._nodes;
        n[0] = xid;
        if (n.length != 1) n.length = 1;
        return c;
    }
});

/* xui.ini xui.browser dom ready
*/
new function () {
    var ini = xui.ini = {
        rootModuleName: '_xui_root'
    };
    //special var
    if (window.xui_ini)
        xui.merge(ini, window.xui_ini, 'all');

    //browser sniffer
    var w = window, u = navigator.userAgent.toLowerCase(), d = document, dm = d.documentMode, b = xui.browser = {
        kde: /webkit/.test(u),
        applewebkit: /applewebkit/.test(u),
        opr: /opera/.test(u),
        ie: (/msie/.test(u) && !/opera/.test(u)),
        newie: /trident\/.* rv:([0-9]{1,}[.0-9]{0,})/.test(u),
        gek: /mozilla/.test(u) && !/(compatible|webkit)/.test(u),

        isStrict: d.compatMode == "CSS1Compat",
        isWebKit: /webkit/.test(u),
        isFF: /firefox/.test(u),
        isChrome: /chrome/.test(u),
        isSafari: (!/chrome/.test(u)) && /safari/.test(u),

        isWin: /(windows|win32)/.test(u),
        isMac: /(macintosh|mac os x)/.test(u),
        isAir: /adobeair/.test(u),
        isLinux: /linux/.test(u),
        isSecure: location.href.toLowerCase().indexOf("https") == 0,
        // detect touch for browser
        isTouch: !!(navigator.userAgent.match(/AppleWebkit.*Mobile.*/)
            || (("ontouchend" in d) && !(/hp-tablet/).test(u))
            || (w.DocumentTouch && d instanceof DocumentTouch)
            || w.PointerEvent
            || w.MSPointerEvent),
        isIOS: /iphone|ipad|ipod/.test(u),
        isAndroid: /android/.test(u),
        isBB: /blackberry/.test(u) || /BB[\d]+;.+\sMobile\s/.test(navigator.userAgent)
    }, v = function (k, s) {
        s = u.split(s)[1].split('.');
        return k + (b.ver = parseFloat((s.length > 0 && isFinite(s[1])) ? (s[0] + '.' + s[1]) : s[0]))
    };
    // for new device
    if (w.matchMedia && typeof w.matchMedia == 'function') {
        // detect touch for device
        b.isTouch = w.matchMedia('(any-pointer: coarse)').matches;
        b.deviceType = b.isTouch
            ? (
                (w.matchMedia('(any-hover: hover)').matches || w.matchMedia('(any-pointer: fine)').matches)
                    ? 'hybrid'
                    : 'touchOnly'
            )
            : 'mouseOnly';
    } else {
        b.deviceType = b.isTouch ? 'touchOnly' : 'mouseOnly';
    }
    // fake touch
    if (xui.ini. && b.deviceType == 'mouseOnly') {
        b. = true;
    }
    xui.$secureUrl = b.isSecure && b.ie ? 'javascript:""' : 'about:blank';

    xui.filter(b, function (o) {
        return !!o
    });
    if (b.newie) {
        b["newie" + (b.ver = dm)] = true;
        b.cssTag1 = "-ms-";
        b.cssTag2 = "ms";
    } else if (b.ie) {
        // IE 8+
        if (xui.isNumb(dm))
            b["ie" + (b.ver = dm)] = true;
        else
            b[v('ie', 'msie ')] = true;
        if (b.ie6) {
            //ex funs for ie6
            try {
                document.execCommand('BackgroundImageCache', false, true)
            } catch (e) {
            }
            w.XMLHttpRequest = function () {
                return new ActiveXObject("Msxml2.XMLHTTP")
            };
        }
        if (b.ie6 || b.ie7) b.ie67 = 1;
        if (b.ie6 || b.ie7 || b.ie8) b.ie678 = 1;
        b.cssTag1 = "-ms-";
        b.cssTag2 = "ms";
    } else if (b.gek) {
        b[v('gek', /.+\//)] = true;
        b.cssTag1 = "-moz-";
        b.cssTag2 = "Moz";
    } else if (b.opr) {
        b[v('opr', 'opera/')] = true;
        b.cssTag1 = "-o-";
        b.cssTag2 = "O";
    } else if (b.kde) {
        b[v('kde', 'webkit/')] = true;
        if (b.isSafari) {
            if (/applewebkit\/4/.test(u))
                b["safari" + (b.ver = 2)] = true;
            else if (/version/.test(u))
                b[v('safari', 'version/')] = true;
        } else if (b.isChrome)
            b[v('chrome', 'chrome/')] = true;

        if (b.isWebKit) {
            b.cssTag1 = "-webkit-";
            b.cssTag2 = "Webkit";
        } else {
            b.cssTag1 = "-khtml-";
            b.cssTag2 = "Khtml";
        }
    }
    // BB 6/7 is AppleWebKit
    if (b.isBB && !b.ver) {
        // BB 4.2 to 5.0
        b.ver = parseFloat(ua.split("/")[1].substring(0, 3));
        b["bb" + b.ver] = true;
    }

    if (!ini.path) {
        var s, arr = document.getElementsByTagName('script'), reg = /js\/xui(-[\w]+)?\.js$/, l = arr.length;
        while (--l >= 0) {
            s = arr[l].src;
            if (s.match(reg)) {
                ini.path = s.replace(reg, '').replace(/\(/g, "%28").replace(/\)/g, "%29");
                break;
            }
        }
    }
    xui.merge(ini, {
        appPath: location.href.split('?')[0].replace(/[^\\\/]+$/, ''),
        dummy_tag: '$_dummy_$'
    }, 'without');
    if (!ini.path) ini.path = ini.appPath + '/xui/';
    if (!ini.basePath) ini.basePath = ini.path.replace(/xui\/$/, "").replace(/runtime\/$/, "");
    ini.releasePath = ini.appPath;
    if (ini.verPath) ini.releasePath += (ini.verPath ? (ini.verPath + "/") : "") + (ini.ver ? (ini.ver + "/") : "");

    var data = new Image();
    data.onload = data.onerror = function () {
        var path = xui.ini.path + "appearance/_oldbrowser/";
        if (this.width != 1 || this.height != 1) {
            document.documentElement.className += " xui-nodatauri";
            xui.merge(xui.ini, {
                img_dd: path + 'ondrag.gif',
                img_busy: path + 'busy.gif',
                img_pic: path + 'picture.png',
                img_handler: path + 'handler.gif',
                img_bg: path + 'bg.gif',
                img_blank: path + 'bg.gif',
                img_touchcur: path + 'touchcur.png'
            }, 'without');
        }
        data.onload = data.onerror = null;
    };
    data.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
    xui.merge(xui.ini, {
        img_dd: "data:image/gif;base64,R0lGODlhEABAAPcAAAAAAAEBAQICAgMDAwUFBAUFBQcHBwgICAkJCQwMDA8PDx4eHiQkJDAwMD8/P0JCQl1dXf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAP8ALAAAAAAQAEAAAAj/AP8JHPigQQMHAxMOTAAAgIABAgAkUPgPQsMABAoQCNAQAISEFw0cMMCxI4CFAAIY+Eey4b+LCgSmXCnzpECVBf49AEBgJEWVBwg8WCCgQMuEQEkuYDBgo8uBIlsyeCCgJMWWAB68fPpP5cCOAhm6TLpV4teQI0tyrTgzrcmPChNoVIuAYsKCB+3qtQsgQt+/fgPb/Ce4MOCvEfb6HbhYb1/Eigc35ptYZmW7kw1rRgy48+S9oEOLHk26tGnRnlMzTl0Yst7Mgyk+tnzWpO3JfSPo3q274eXcfjv21rxbeHDBwE32VphbeHPmvYEvBzmc9+eXxa3Hxm69OHPbtk2zNO68WvNh2q8lb6fuuix434Ola5/Nvbt53tLhH8/unXpw49vlhx90/E2HmH3XyTcgSO91FBAAOw==",
        img_busy: "data:image/gif;base64,R0lGODlhEAAQAOMAAAQCBHx+fLy+vOTm5ERCRMTGxISGhAQGBISChMTCxOzq7FRSVMzKzP7+/gAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQJCQANACwAAAAAEAAQAAAESrDJSau9OOvNe1VFonCFIBRcIiQJp7BjNySDxRjMNAQBUk+FAwCAaiR6gURhsUgYhgCEZIDgDRYEwqIALTZmNay2UTB4KwKmwBIBACH5BAkJAA8ALAAAAAAQABAAgwQCBHx+fLy+vERCRKSmpOTi5BQWFNTW1KyurIyKjMTCxERGRPTy9BwaHLSytP7+/gRE8MlJq7046827n47RIJwBAEZ5phsikg9TMNZBHBMj7PR0DEDco7ATFA6JhA04IEh0AgUjEQgomcLY7EG1PmzZClJpiQAAIfkECQkADQAsAAAAABAAEAAABEewyUmrtcywWxn4BTcZH4CIUlGGaFMYbOsuSywuBLHIuC4LNEFrkBjIBoEAwmhRFBKKRDKQuBQEgsIAoWRWEoJEleitRKGWCAAh+QQJCQAPACwAAAAAEAAQAIMEAgR8fny8vrxEQkSkpqTk4uQUFhTU1tSsrqyMiozEwsRERkT08vQcGhy0srT+/v4ERfDJ6UxDM2sDgHkHcWgT5x1DOpKIhRDpQJAaqtK1iJNHkqy7RyIQSAQlw+IR5APiGAXGkiGoSoOFqqBwpAoU1yA0vJxEAAAh+QQJCQANACwAAAAAEAAQAAAES7DJWdYqMzdmWFsEsTRDMkwMoFbhMgQBcjaGCiCCJQhwkEgFG2YyQMRmjYJhmCkhNVBFoqCAQgu7nzWTECS0W4k0UQ2bz+i0en2OAAAh+QQJCQAPACwAAAAAEAAQAIMEAgR8fny8vrxEQkSkpqTk4uQUFhTU1tSsrqyMiozEwsRERkT08vQcGhy0srT+/v4ERfDJeVI6M79DcApB8jAFQy3DUIEJI7zmQ6RDZx3FKxTSQWMTl0AR23Q0o5LEYWggkEgDAGCAaqRUawbRfGq/4LB4TC5DIwAh+QQJCQANACwAAAAAEAAQAAAER7DJqUpSM7eRRkuCUGjSgAQIJyQJ+QXwxWLkAKeuxnm5VCyLVk+yIBAWQ6IRmRQABclJwcCIMg4AwGhoyAIQyYJ3O5ySo9EIACH5BAkJAA8ALAAAAAAQABAAgwQCBHx+fLy+vERCRKSmpOTi5BQWFNTW1KyurIyKjMTCxERGRPTy9BwaHLSytP7+/gRG8MlJ62SFWcuE19tUeEIRXp4Cng+2hkeSHKyUBEFSP3e+x7Od5ECg1Q6LwcB4IigHBETD4NgcngcDAGCAFR9a7g5hMCAsEQA7",
        img_pic: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAJOgAACToB8GSSSgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAA92SURBVHiczZt7fFTlmce/ZzKT66S5cQsChUC4yKVsFaEUYlAWi4ClfqTq6tYVrfVSy1W01roudPWj4H6ga6ygu3SpZdeu0iKIgLFoIZREBAIGSDDhHkLIhMncJzNz3v3jPScZkklyzkzYT5/5vJ9J5pzznvf3O8/7vM/zvM9RhBAkIoqiWAALYNNaMpCkHY4AIaBV+1aFEGpCN+xlURIhQAOfBKQCGUAmkI4kQUEC9wEewAv4gfDfEgnWeC9UFEVBPvk04BtAXyAXSUKqdloQCf4q4ABaAK+iKKG/FRLiJgAJPgUJuL/W+gHpAyBTBdEon74PqR2p2v0UJAmtZkjQCL9GRKLzlzgJiHr6KUAWkJMPgyfB8BkwdDjkW4DTcGU31B6D+jNgsUJSWF6nAJ6eSFAURcFJAWl8Cz9ZOKliPcd5iSAgFEVRkTzETURcNkCb+8lIlc8fDeN/CjO/D7f2gb5WsGoGIOSCli1QthEOfgE1yKlwCWhCTo+Y00HxKzeQyjsofO+aAxHqqWIR32I30rCGgEjcJAghTDek4csAhoyHO7fCe5ehQYCI1a6C869w8LvwPHA3UAwUAnlILbJc07+fIgTNiG4+VfwKyEfaH1vHPow2S1ysSVFSIHk2DJoKk/tJGxBTsiFrLIx6FeYXwY0a8IFIDbIDNk2rUAJKEal8BOR0e/fRrOBFpml9pANJsexET5IIAaIAlHtgUhbc0NPJmWCfCDe+Bt+fBqOJRYJTmaGBtxsYuY0fsRgYgLRDKYDFLAnxrgIqEJ4MDIZh1nbHp1vJgIwbYczLoD4P7IOTbQcrmEo2mzECXpc+FCI1L4D0MVq1sRmWRDQgMhWUTKmqhg1QJmRMhLFr4AdFuia8zmxu4j3MgJed5ZJEDlID0mlfZg1LXARoFlf9IzS0QoUwyXomZIyD0f8Kdw1/jNn8jNewkGZ6IE04iJBKu/dpSBOjJW5HSAihblCUsApVQi5pA8xcnwEZzmLGX1jLzVjj1MRTnEc+xCTa/YvrrwG6PCaEbyNsjMABs9d+VgT3bSctmBbnGAIEeJrdyIArrH2rmJiOkCABABUQcMEqAYeNXrPnVpi7A7wZcd9WsJZtHMaBNH5eZNxhPr4w6Pjorm90U9A8yR2Qch5GhOFAV86Q3v58KyLD062L09NH5U22ASuAx4F5wASgD9IOWLoab0xs3QH3+xkaibAyHOajcJjyQIC3Gxq4H2l0UpA2xAIo68HWBLcI+Or/AfxzwJPAAmAKMBiw4/PdQzi8nnC4nFBoB17vy3z++RhkIKYbScUQAeEwjwqBK9Zht5udK1cyFumGpugdb4P0Bhgfhr2dwBf3Avg3+Aj4OfAUcC8wDRjOW28VEgp9GBNIJOKhpmY50vHKoIPb3BX4BT3NDL+fc88+yzRkHqBtDV4ASZdgrArHosGnexME/zp/BlYCi4D7gOnACDZtGkckUtvjPC4tXappSpY+VWIS4HKRJwSXjcQSXi8XnniCmcigxK6TsB/SHDAlDOW9An4VB4H1wEvAo8BtwCg2bhxvCLwQgkDAye23/z0wlPYASon19P/BTEDl8XDxkUf4HjIeaCNhPdiKt/Ngqp9IvNAVFfHtxTj7wi7gbeBfgPuBSaxZc5Nh8Hr77W//DbhFG2s6YOlk7UMhXjdDgGYT6hcuZPY1JPi5HUHcz15REXOfQPwSgj+Guhvgv4EXgAd46KE5tLaeNjdKIfjss13AbGAM0oW3dvIDhCCl4289id1O/rp1/MfChUwAsjjGHVj5EEG62b4AFAFznoLv/gb6Q/IUyF8KE8dCDsXFfSkp2YDNNjSOrlOR6m9HWxU6usKKz8eRrCzzPesk1Exl3b5s/pkAaaSirQ/G+4kGn4lc3AdCagZ8c1BGxm0PvP/+4HBGRp75EQJHjtQjV60UtNWgkwYcPkypquKJp3+7nfxt97JsSCM+WpBBagTDzmkX4BkADIW0GV7viIfWrPEY7zFKgsEgGzee6vR7RxsApNTVscysHYhuzS6uDDlIMxcQuBGEEKjG5vwrIN4A8T8g/gKiBoQDRABECMQVcP9oxYpzCKGaGtWvf/1HYAnSiN6i8ZoSiwAbkFNfz5ZESHC00DSkAqcREoyAj2gtAKIWPD945pkLhknYt+8Q8CzwE2AuMBZpBG2dzkXO2vTsbL555gzbEyHhylWah5TT0h0JRsGrWguBaAFRCd55y5df6pGEsrJDWK3PA08jvcepSIcoHUiKRYCuBdmZmYyqrWXHdSRBvW0RLiPgda8yAiIIohnEIfDOWb68vksSysoOa+AXAQ/Qno3OpitHSCNB3/ToY7dz49dfs/M6kKAm/Ts7RsO6lVBrBHw0CQHtvEPgmRNLE/bu/Qqr9UVgMfAgcDsyBdeHqFR8l6PWSEgF+trtjO1lElTeYCvwnAWevgWW7oQ6I+CF9ns0CV+Cb240CXv21GC1rkFGjf8EzESm4/tqmNqCoS53hqK2v2xApt1O/8pKXi8oYFb3603X0uTk6k3VJJ3bSynPsB+ZzHDkgWMp5D4MP8+BiTbaA/quRGgthMyGnAHfi8uXt5TOmhUMzp69i0jEC9QDtfIwl5Cbs/o2fdtTjn0DeYKqXeD2eLg8+k/8/vOzVMVLQJ9scg6PJPSdLRxBbos5gAYHnF29cmX1iOZmb/WoUcf0/FZ3LoSe/LMhY9yhkL5qzZqsV2fN8g2JRNKQGaIQ0hvxaf9HosHrQLtt2n2SqGEml/FYqojsqeN4ItPh6lUai4tZBMwCxrJ69TgikWqEECk+X8P+wsJTzSC8mtXvaip0nA7NII6C9zdQWQjrkEmTecB4pPp33oYzMmLc3EoYN34EjQhLFZHSU9QkQkJLCw3z53M/jz46ndbWU9FHrR5P45ZRo47Vg3CDaDVIQhCEC0QdeLbCl38no8cFQBFQgIwDrERlhXoGLzcq3agIwog2Er5C3X2S2kRIONgw6ARe75lYR60uV9N7I0acO6+BMkpCSCPCAe49cGCKdIDmAZOQnnU6PWWE2g6GmK4tXEJLTXQm4QR18YCvduW3pLQ0NnZ3ltXpbN40cmS1URJ0IvTWAq59sL8IltG+DGYDth4J6AS+Iwm++Ek42ZLvSm6+5DBydpLL1fT7wsJaMyRENze4y2DvZHgYmT3ur9kCpUsC8DAAgaPL0CUBEk625LuSHfXNZvTF5nQ2by4sPK2T0JNhjFGfcOV92PRtmUobiKxriu0IAQoqW3rM2cQg4ZMeSIgHfLQmbBo58sR5zTCaJaERau6UgdAgjYDYGoCbvj2C75qESNkRjvU2eL31+fjj0r9C3SUQPs3oGSUgCIG9sGqcDITalsPOjpCNm7r1Zjp6I3q1kB3U3WwtnsTblZVURJ9W7cp3Twh/GW7Nze++6qM7KS+v8N111x9Ww6uX4ZBeCGA0M5IESf0hq0j+23bpNQQoiqKgkm1qYDoJ/8V2lrI/FCI4ZQolx49TBlDjzndNiBwKJQS+rOww06Z94AuF1K1wvgReCMFxM2khBUKZQKHcSA3rv3fWgEYqTQ/wbT7iCcqQvr0zEODS5Mm8uK1q2M4JHA205gzINd2nPvD9ZUcoLv6AcDgI+CLgKYW6Y/AzAUdMdBWKwL4T0CI0gVgEzKSOCLWGu32HHfyEfYCb9hK4i56HnvLfVVA1OpjZp5+JQV4jeeU7zj6/s2jQ4PxwCjKQcQCO0+BYCxUn4F4VvjDQlVBlUHR+vRC+a490XAHAxiFmIwxsaLzDDmTI+VNktqUIGMnq1eMIhWoSMXh55TvO/OplS2TtWsRbb3F54kQeQ26EDkGmtZNeAqsXJgm5IRvqwgCqETjph0diLvkxlsEkIJOj/JIwgZjAAwRYwwdIN/Mp5F5dEVBISckYPbDpDfC/+x2itBRRUUH9vHnMR25tZaFldE5BihOGqfC+KmsVVc0jjKgQUOFkCJa9BNZYt+uUD4iqAs1mCZN5jEX0YwzZ9OUKTZziPMsppZwmZCjuABqABkpKrDz++J+wWEYaU/LOklfx8dkln84dbE9XLXl5kJ8vW9++ANQvXszCzZupApxoiXchhLisKBm5cE8STFJk4OMX8JkKR6xC7O3qfrEIUDQtSEPW8A0A+pNEjlaQlISMq/3aIK4AjZSUJCcM/uDOs0s+mRMTfGYm2Gzg83HhySdZ+O67HIf23QchhEBRrC2QaYPUdAhfhdYcIVq6u2fMjJBGghUZOWXBNaVoOgFebQBOXnnFyooVH19v8BYLKAq43Vz44Q/5x507OYV8CEHirBfuLiWmV1+lILUhTfvbgiRAfxkiQCj0n1itC+IBDpB3cNe5JZ/cOcierlpyc2HgwK7B61JXx1+GD2cRcBn5IIJ0zPYYkO5SYirSYfBrN2hCLnH1yDnfBLjweot7E3z0k7fbY4MHKCigqKSEecgsbwZxFElCD1ViGpt6XlAvR/Vp3wEgRHLyDLM3bZMDByoXbLzTEQ1+4MB28MnJscHrMmEC30Gmutpqhc0OoccLRLuoQohIVJMlaYoy3uxNASgvr2T69P99Z4O62e3mC7PgAQYMYCjSPn0DLd1tdhiJ1gkqqGqz6avKyyuZNu0PhMPecBjHqlWsDoX43Ax4gJYWAkj1z6C9WMuUJFwoSSh0zNT5UeCBZqC+tZVz993Hc01NfGoUPEB1NQ20v65nshJBSuIE7Nu3GVV1Gjq3vPxoR/DAReCiy8WFqVNZdvYsnxoB7/fjf+01vkSGtaZLZHVJnIA77rhEdfULPZ5XXn6UoqJo8PqKcgW5ljudThpuvpklp0/zaU/drVvH9spKmpHGWN8EuT6lsl012jdnctm162n8/s6JzmAwyJtvfojF8hxyi/pB2vfq+iH9C6vW0oB+ycmM3bWLdaEQ/o63dblw/eIXvAs8A/wYmIPc788lKttrtCX05ii0OUypQC7Tp4/i4YdnM2zYOBQlnaNH69m06WsOHtSLmp1AI+1+hJtr3/LQ45BMoM/8+Yy7+25mFBQwyuuFQ4eo37CB6tOncdO+tXYRqUnNQECYfCGzNwjQ3eY05JLUD+mc6GW0oO0vaoNs0r69aOB17y1qQzYZadlztb70N1JtWn9BwKX11Yh8M1V/LdcUoETeHAWkn6Aoih4cgfQePciYPZoAD5IEN9KZCtPBddX6UmnXighyjrdo/UUT4EGS4Nbu3buxgOmO2qPIZK3p1eQKEmyrNvBWtI3frgas9RXdX4r2bUVa+3BUX60k8OJkrxEAnQau1+mDfJptzehgo6ZEdIvur1sijcj/AcgCrHU5y1W7AAAAAElFTkSuQmCC",
        img_handler: "data:image/gif;base64,R0lGODlhBAAEAPcAAAAAAGSMtP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAP8ALAAAAAAEAAQAAAgPAP8JFCDwX4B/BAUe/BcQADs=",
        img_touchcur: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAATCAMAAACqTK3AAAAAnFBMVEVKS0sAAAD6+vr39/fj4+OsrKxQUVHk5OTY2NjV1dVgYWHm5ube3t7c3NzV1dXT09PPz8/q6ur19fXNzc2/v7/v7+/u7u6QkJB1dnbt7e1SU1Pd3d3b29vW1tbU1NTT09Ps7Ozl5eXe39/e3t709PS7u7u5ublmZ2fp6enn5+fj4+Ph4eHg4ODc3Nzc3NzZ2dnZ2dnW1tbU1NTT09Pxrtv7AAAANHRSTlPmAP78+fHnyPf26NGiizAcBfr49fPu7e3q6Oedh08oDPr5+Pj38vLp3NfBuLGUkXRrSzgYlzzxjwAAAKFJREFUGNNl0NUOwzAMQFE7sDLzSmPm/f+/LY2atVXv45FlyQac1ZPnaCfLdgdqr4TF/KATq+nJS1gOXWZE35L8wlhAHw+bjuxAiCqyOgozGDKJC1hTGKeXgM52QnsN0DYmxM9iik0oFlMuWY6JVYCY8JHk5CvoSc2/LNY3edAlOCox0laSr1Eu92WrwlPPeaWE6Ru6u/soSfapyketXjjrB1sXCDrwyo6RAAAAAElFTkSuQmCC',
        // transparent 1*1 gif and png
        img_bg: data.src,
        img_blank: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
    }, 'without');

    //for dom ready
    var f = xui._domReadyFuns = function () {
        if (!xui.isDomReady) {
            if (d.addEventListener) {
                d.removeEventListener("DOMContentLoaded", f, false);
                w.removeEventListener("load", f, false);
            } else if (d.detachEvent) {
                d.detachEvent("onreadystatechange", f);
                w.detachEvent("onload", f);
            }

            // adjust touchonly again
            if (xui.browser.deviceType != 'touchOnly' && !xui.Dom.getScrollBarSize()) {
                // in Mac, the element barsize is 0 without mouse device plugged
                // and if you plug the mouse, barsize will be 15

                //xui.browser.deviceType = 'touchOnly';
                if (xui.UI) {
                    var f2 = function (c) {
                        xui.arr.each(c, function (key) {
                            if (key = xui.SC.get(key)) {
                                if (key.$DataModel.overflow) {
                                    key.$DataModel.overflow.ini = 'auto';
                                    key.$DataStruct.overflow = 'auto';
                                }
                                if (key.$children && key.$children.length) f2(key.$children);
                            }
                        });
                    };
                    f2(xui.UI.$children);
                }
            }
        }

        try {
            if (xui.ini.customStyle && !xui.isEmpty(xui.ini.customStyle)) {
                var arr = [], style = xui.ini.customStyle, txt;
                xui.each(style, function (v, k) {
                    arr.push(k + " : " + v + ";")
                });
                txt = ".xui-custom{\r\n" + arr.join("\r\n") + "\r\n}";
                xui.CSS.addStyleSheet(txt, "xui:css:custom", 1);
            }
            ;
            for (var i = 0, l = xui._m.length; i < l; i++)
                xui.tryF(xui._m[i])
            xui._m.length = 0;
            xui.isDomReady = true;
        } catch (e) {
            xui.asyRun(function () {
                throw e
            })
        }
    };

    if (d.addEventListener) {
        d.addEventListener("DOMContentLoaded", f, false);
        w.addEventListener("load", f, false);
    }
    //IE<=10
    else {
        d.attachEvent("onreadystatechange", f);
        w.attachEvent("onload", f);

        var ff = function () {
            if (xui.isDomReady) return;
            try {
                //for ie7 iframe(doScroll is always ok)
                d.activeElement.id;
                d.documentElement.doScroll('left');
                f()
            } catch (e) {
                xui.setTimeout(ff, 9)
            }
        };
        ff();
    }

    // to ensure
    var fe = function () {
        ((!xui.isDomReady) && ((!d.readyState) || /in/.test(d.readyState))) ? xui.setTimeout(fe, 9) : f()
    };
    fe();
};

// for loction url info
new function () {
    xui._uriReg = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/;
    xui._localReg = /^(?:about|app|app\-storage|.+\-extension|file|widget):$/;
    xui._curHref = (function (a) {
        try {
            return location.href;
        } catch (e) {
            a = document.createElement("a");
            a.href = "";
            return a.href;
        }
    })(),
        xui._localParts = xui._uriReg.exec(xui._curHref.toLowerCase()) || [];
};

new function () {
    xui.pseudocode = {
        getScope: function (eventArgs, module, temp) {
            var parentModule;
            try{
                 parentModule=module.getParentModule();
            }catch (e) {
                
            }
          
            return {
                temp: temp,
                page: module,
                parentModule:parentModule,
                args: eventArgs,
                functions: xui.$cache.functions,
                'constant': xui.constant,
                'global': xui.$cache.data,
                // special functions
                getCookies: xui.Cookies.get,
                getFI: function (key) {
                    var h = xui.getUrlParams();
                    return h && h[key]
                }
            };
        },
        exec: function (_ns, conf, resumeFun, level) {
            var ns = this, t, tt, m, n, p, k, arr, type = conf.type || "other",
                comparevars = function (x, y, s) {
                    switch (xui.str.trim(s)) {
                        case '=':
                        case 'is':
                            return x === y;
                        case '<>':
                        case 'is-not':
                        case '!=':
                            return x !== y;
                        case 'exists':
                        case 'defined':
                            return xui.isDefined(x);
                        case 'not-exists':
                        case 'undefined':
                            return !xui.isDefined(x);
                        case 'empty':
                            return xui.isEmpty(x);
                        case 'non-empty':
                            return !xui.isEmpty(x);
                        case '>':
                            return parseFloat(x) > parseFloat(y);
                        case '<':
                            return parseFloat(x) < parseFloat(y);
                        case '>=':
                            return parseFloat(x) >= parseFloat(y);
                        case '<=':
                            return parseFloat(x) <= parseFloat(y);
                        case 'include':
                            return (x + "").indexOf(y + "") != -1;
                        case 'exclude':
                            return (x + "").indexOf(y + "") == -1;
                        case 'begin':
                            return (x + "").indexOf(y + "") === 0;
                        case 'end':
                            return (x + "").indexOf(y + "") === (x + "").length - (y + "").length;
                        case "objhaskey":
                            return typeof(x) == "object" ? (y in x) : false;
                        case "objnokey":
                            return typeof(x) == "object" ? !(y in x) : false;
                        case "arrhasvalue":
                            return xui.isArr(x) ? xui.arr.indexOf(x, y) !== -1 : false;
                        case "arrnovalue":
                            return xui.isArr(x) ? xui.arr.indexOf(x, y) == -1 : false;
                        case "objarrhaskey":
                            return xui.isArr(x) ? xui.arr.subIndexOf(x, 'id', y) !== -1 : false;
                        case "objarrnokey":
                            return xui.isArr(x) ? xui.arr.subIndexOf(x, 'id', y) == -1 : false;
                        default:
                            return false;
                    }
                },
                adjustparam = function (o) {
                    if (typeof(o) == "string") {
                        var jsondata, oo;
                        if (xui.str.startWith(o, "[data]")) {
                            o = o.replace("[data]", "");
                            jsondata = 1;
                        }
                        o = xui.adjustVar(oo = o, _ns);
                        if (!xui.isDefined(o)) o = xui.adjustVar(oo);
                        // for file
                        if (jsondata && typeof(o) == "string")
                            o = xui.unserialize(xui.getFileSync(o));
                    } else if (xui.isHash(o)) {
                        // one layer
                        for (var i in o) o[i] = adjustparam(o[i]);
                    } else if (xui.isArr(o)) {
                        // one layer
                        for (var i = 0, l = o.length; i < l; i++) o[i] = adjustparam(o[i]);
                    }
                    return o;
                },
                redirection = conf.redirection,
                target = conf.target,
                method = conf.method,
                // className=conf.className,
                // conf.args > conf.params
                iparams = xui.clone(conf.args || conf.params) || [],
                conditions = conf.conditions || [],
                adjust = adjustparam(conf.adjust) || null,
                iconditions = [], t1, t2,
                timeout = xui.isSet(conf.timeout) ? parseInt(conf.timeout, 10) : null;

            var _debug = '"' + conf.desc + '"',
                _var = {type: type, target: target, method: method, args: iparams, pseudo: conf};

            // cover with inline params
            if (method.indexOf("-") != -1) {
                t = method.split("-");
                method = t[0];
                for (var i = 1, l = t.length; i < l; i++)
                    if (t[i]) iparams[i - 1] = t[i];
            }
            // handle conditions
            // currently, support and only
            // TODO: complex conditions
            for (var i = 0, l = conditions.length, con; i < l; i++) {
                con = conditions[i];
                if (!comparevars(
                    !xui.isDefined(t1 = xui.adjustVar(con.left, _ns)) ? xui.adjustVar(con.left) : t1,
                    !xui.isDefined(t2 = xui.adjustVar(con.right, _ns)) ? xui.adjustVar(con.right) : t2,
                    con.symbol)) {
                    if (typeof resumeFun == "function") {
                        xui._debugInfo.apply(xui, ["pseudo", xui.str.repeat('  ', level || 1), "//", _debug, _var]);
                        return resumeFun();
                    }
                    xui._debugInfo.apply(xui, ["pseudo", xui.str.repeat('  ', level || 1), "//", _debug, _var]);
                    return;
                }
            }
            if (redirection && (arr = redirection.split(":")) && xui.isArr(arr)) {
                if (arr[0]) type = arr[0];
                if (arr[1]) target = arr[1];
                if (arr[2]) method = arr[2];
            }
            if (target && method && target != "none" && method != "none") {
                //adjust params
                for (var i = redirection ? 3 : (type == "other" && target == "callback") ? method == "call" ? 1 : method == "set" ? 2 : 0 : 0, l = iparams.length; i < l; i++)
                    iparams[i] = adjustparam(iparams[i]);

                if (redirection && !(type == "other" && target == "callback" && method == "call")) {
                    iparams = iparams.slice(3);
                }

                var fun = function () {
                    xui._debugInfo.apply(xui, ["pseudo", xui.str.repeat('  ', level || 1), _debug, _var]);
                    if (false === xui.tryF(ns._Handlers, [type, method, iparams, adjust, target, conf])) return;
                    switch (type) {
                        case 'page':
                            // handle switch
                            if (method == "switch") {
                                if (!xui.History._callbackTag) {
                                    xui.History._callbackTag = function (fi, init) {
                                        if (init) return;
                                        var ar = xui.urlDecode(fi || "");
                                        if (!ar.cls) {
                                            ar.cls = "App";
                                            ar.cache = true;
                                        }
                                        // get root only
                                        xui('body').children().each(function (xid) {
                                            var module = xui.Module.getFromDom(xid);
                                            if (module && module._showed) {
                                                if (ar.cache) module.hide(); else module.destroy();
                                            }
                                        });
                                        xui.showModule(ar.cls);
                                        return false;
                                    };
                                }
                                var hash = {
                                    cls: target,
                                    cache: !!iparams[0]
                                };
                                if (iparams[1] && !xui.isEmpty(iparams[1])) {
                                    hash = xui.merge(hash, iparams[1]);
                                }
                                xui.History.setFI(hash, true);
                                return;
                            } else if (method == "open") {
                                var hash = {
                                    cls: target
                                };
                                if (iparams[0] && !xui.isEmpty(iparams[0])) {
                                    hash = xui.merge(hash, iparams[0]);
                                }
                                window.open('#!' + xui.urlEncode(hash));
                                return;
                            }
                            // try to get module
                            var cls = xui.get(window, target.split(".")), ins;
                            // TODO: now, only valid for the first one
                            if (cls) for (var i in cls._cache) {
                                ins = cls._cache[i];
                                break;
                            }

                            if (method == "destroy") {
                                if (ins) if (xui.isFun(t = xui.get(ins, [method]))) t.apply(ins, iparams);
                                return;
                            } else if (method == "show") {
                                // special for xui.Module.show
                                iparams.unshift(function (err, module) {
                                    if (err) {
                                        xui.message(err);
                                    }
                                });
                            }
                            if (ins) {
                                if (xui.isFun(t = xui.get(ins, [method]))) t.apply(ins, iparams);
                            }
                            // make sure call getModule once
                            else {
                                var t1 = _ns.temp._module_funs_ = _ns.temp._module_funs_ || {},
                                    t2 = t1[target] = t1[target] || [];
                                // collect funs
                                t2.push(function (ins, t) {
                                    if (xui.isFun(t = xui.get(ins, [method]))) t.apply(ins, iparams);
                                });
                                // Calling asyn call, but only for the first time
                                if (t2.length === 1) {
                                    xui.getModule(target, function (err, ins) {
                                        if (err) return;
                                        if (ins)
                                            for (var i = 0, l = t2.length; i < l; i++)
                                                t2[i].call(null, ins);
                                        t2.length = 0;
                                        t1 = t2 = null;
                                        delete _ns.temp._module_funs_[target];
                                    });
                                }
                            }
                            break;
                        case 'control':

                        case 'module':
                            if (method == "disable" || method == "enable") {
                                if (xui.isFun(t = xui.get(_ns.page, [target, "setDisabled"]))) t.apply(_ns.page[target], [method == "disable", true]);
                            } else {
                                if (method == "setProperties") {
                                    // [0] is native var, [1] is expression var
                                    var params = xui.merge(iparams[0], iparams[1], 'all');
                                    iparams[1] = null;
                                    if (m = params) {
                                        if (m.CA) {
                                            if (xui.isFun(t = xui.get(_ns.page, [target, "setCustomAttr"]))) t.apply(_ns.page[target], [m.CA]);
                                            delete m.CA;
                                        }
                                        if (m.CC) {
                                            if (xui.isFun(t = xui.get(_ns.page, [target, "setCustomClass"]))) t.apply(_ns.page[target], [m.CC]);
                                            delete m.CC;
                                        }
                                        if (m.CS) {
                                            if (xui.isFun(t = xui.get(_ns.page, [target, "setCustomStyle"]))) t.apply(_ns.page[target], [m.CS]);
                                            delete m.CS;
                                        }
                                    }
                                }
                                if (xui.isFun(t = xui.get(_ns.page, [target, method]))) t.apply(_ns.page[target], iparams);
                            }
                            break;
                        case 'otherModuleCall':
                            var moduleTarget = target, com;
                            if (target && (arr = target.split("##")) && xui.isArr(arr)) {
                                if (arr[0]) moduleTarget = arr[0];
                                if (arr[1]) com = arr[1];
                            }
                            var otherModule = xui.getModule(moduleTarget);
                            if (com) {
                                if (xui.isFun(t = xui.get(otherModule, [com, method]))) t.apply(otherModule[com], iparams);
                            } else {
                                if (xui.isFun(t = xui.get(otherModule, [method]))) t.apply(otherModule, iparams);
                            }

                            break;

                        case 'other':
                            switch (target) {
                                case 'url':
                                    switch (method) {
                                        case "close":
                                            window.close();
                                            break;
                                        case "open":
                                            xui.Dom.submit(iparams[0], iparams[1], iparams[2], iparams[3]);
                                            break;
                                        case "mailTo":
                                            xui.mailTo.apply(xui, iparams);
                                            break;
                                        case "selectFile":
                                            xui.Dom.selectFile.apply(xui.Dom, iparams);
                                            break;
                                        case "readText":
                                            xui.getFileAsync.apply(xui, iparams);
                                            break;
                                        case "readJSON":
                                            iparams[4] = {rspType: 'json'};
                                            xui.getFileAsync.apply(xui, iparams);
                                            break;
                                    }
                                    break;
                                case 'msg':
                                    if (method == "busy" || method == "free") {
                                        if (xui.isFun(t = xui.get(xui.Dom, [method]))) t.apply(xui.Dom, iparams);
                                    } else if (method == "console" && xui.isDefined(window.console) && (typeof console.log == "function")) console.log.apply(console, iparams);
                                    else if (xui.isFun(t = xui.get(xui, [method]))) t.apply(xui, iparams);
                                    break;
                                case "var":
                                    if (iparams[0].length) {
                                        var v = iparams[1];
                                        if (iparams[2])
                                            v = xui.get(v, iparams[2].split(/\s*\.\s*/));
                                        if (adjust) {
                                            switch (adjust) {
                                                case "serialize":
                                                    v = xui.serialize(v);
                                                    break;
                                                case "unserialize":
                                                    v = xui.unserialize(v);
                                                    break;
                                                case "stringify":
                                                    v = xui.stringify(v);
                                                    break;
                                                default:
                                                    if (typeof(adjust = xui.get(adjust)) == "function")
                                                        v = adjust(v);
                                                    break;
                                            }
                                        }
                                        xui.set(_ns, (method + "." + xui.str.trim(iparams[0])).split(/\s*\.\s*/), v);
                                    }
                                    break;
                                case "callback":
                                    switch (method) {
                                        case "setCookies":
                                            if (iparams[0] && !xui.isEmpty(iparams[0])) xui.Cookies.set(iparams[0]);
                                            break;
                                        case "setFI":
                                            if (iparams[0] && !xui.isEmpty(iparams[0])) xui.History.setFI(iparams[0], true, true);
                                            break;
                                        case "set":
                                            t = iparams[1];
                                            if (xui.isStr(t) && /[\w\.\s*]+[^\.]\s*(\()?\s*(\))?\s*\}$/.test(t)) {
                                                // args[0] => args.0
                                                t = t.replace(/\[(\d+)\]/, ".$1");
                                                t = t.split(/\s*\.\s*/);
                                                if (t.length > 1) {
                                                    m = t.pop().replace(/[()}\s]/g, '');
                                                } else {
                                                    m = t[0].replace(/[{()}\s]/g, '');
                                                    t = ["{window"];
                                                }
                                                t = t.join(".") + "}";
                                                t = xui.adjustVar(tt = t, _ns);
                                                if (!xui.isDefined(t)) t = xui.adjustVar(tt);
                                                if (t && xui.isFun(t[m]))
                                                    xui.$cache.callback[iparams[0]] = [t, m];
                                            }
                                            break;
                                        case "call":
                                            var args = iparams.slice(3), doit, doit2, y;
                                            t = iparams[0];
                                            if (xui.isStr(t) && /[\w\.\s*]+[^\.]\s*(\()?\s*(\))?\s*\}$/.test(t)) {
                                                // args[0] => args.0
                                                t = t.replace(/\[(\d+)\]/, ".$1");
                                                t = t.split(/\s*\.\s*/);
                                                if (t.length > 1) {
                                                    m = t.pop().replace(/[()}\s]/g, '');
                                                } else {
                                                    m = t[0].replace(/[{()}\s]/g, '');
                                                    t = ["{window"];
                                                }
                                                t = t.join(".") + "}";
                                                t = xui.adjustVar(tt = t, _ns);
                                                if (!xui.isDefined(t)) t = xui.adjustVar(tt);
                                                if (t && t[m]) {
                                                    // it's function
                                                    if (xui.isFun(t[m])) {
                                                        doit = 1;
                                                    }
                                                    // it's pseudo actions or function
                                                    else if ((t[m].actions && xui.isArr(t[m].actions) && t[m].actions.length) || t[m]['return']) {
                                                        t = t[m];
                                                        doit2 = 1;
                                                        if (args && args.length && t.params && t.params.length)
                                                            for (var i = 0, l = args.length; i < l; i++)
                                                                if (y = t.params[i] && t.params[i].type)
                                                                    args[i] = y == 'String' ? (args[i] + '') : y == 'Number' ? (parseFloat(args[i]) || 0) : y == 'Boolean' ? (!!args[i]) : args[i];
                                                    }
                                                }
                                            } else if (xui.isStr(t = iparams[0]) && xui.isFun((n = xui.$cache.callback[t]) && (t = n[0]) && t && (t[m = n[1]]))) {
                                                doit = 1;
                                            }
                                            if (doit) {
                                                t = t[m].apply(t, args);
                                            } else if (doit2) {
                                                // nested call
                                                // arguemsnt of function/event is modified
                                                t = ns._callFunctions(t, args, _ns.page, _ns.temp, null, 'nested' + (t.desc || t.id || ""), (level || 1) + 1);
                                            }
                                            if (doit || doit2) {
                                                if (iparams[1] && iparams[2] && xui.get(_ns, iparams[1].split(/\s*\.\s*/))) xui.set(_ns, (iparams[1] + "." + iparams[2]).split(/\s*\.\s*/), t);
                                            }
                                            break;
                                    }
                                    break;
                                default :
                                    try {
                                        var otherModule = xui.getModule(target);
                                        if (xui.getModule(target)) {
                                            if (xui.isFun(t = xui.get(otherModule, [method]))) t.apply(otherModule, iparams);
                                        }
                                    } catch (e) {
                                        console.log(e)
                                    }
                                    break;
                            }
                            break;

                    }
                };
                // asy
                if (timeout !== null) xui.asyRun(fun, timeout);
                else fun();
            }
            return conf["return"];
        },

        _callFunctions: function (pseudo, args, module, temp, holder, fromtag, level) {
            temp = temp || {};
            var ns = this, fun, resume = 0, t, rtn,
                funs = pseudo.actions || pseudo || [],
                rtn = pseudo['return'], funsrtn,
                innerE = funs.length == 1 && (typeof(funs[0]) == 'function' || typeof(funs[0]) == 'string'),
                _ns = ns.getScope(args, module, temp),
                recursive = function (data) {
                    var irtn;
                    // set prompt's global var
                    if (xui.isStr(this)) _ns.temp[this + ""] = data || "";
                    //callback from [resume]
                    for (var j = resume, l = funs.length; j < l; j++) {
                        resume = j + 1;
                        fun = funs[j];

                        if (module && typeof fun == 'string') fun = module[fun];
                        if (holder && typeof fun == 'string') fun = holder[fun];
                        if (module && xui.isHash(fun) && typeof (fun.script) == "string") fun = module[fun.script];
                        if (holder && xui.isHash(fun) && typeof (fun.script) == "string") fun = holder[fun.script];
                        if (typeof fun == 'function') {
                            // only function action can affect return
                            if (false === (irtn = xui.tryF(fun, _ns.args, _ns.page))) {
                                resume = j;
                                break;
                            }
                        } else if (xui.isHash(fun)) {
                            if ('onOK' in fun || 'onKO' in fun) {
                                var resumeFun = function (key, args, flag) {
                                    if (recursive) {
                                        if (xui.isStr(flag)) _ns.temp[flag] = true;
                                        return recursive.apply(key, args || []);
                                    }
                                };
                                // onOK
                                if ('onOK' in fun) (fun.args || fun.params || (fun.args = []))[parseInt(fun.onOK, 10) || 0] = function () {
                                    if (resumeFun) resumeFun("okData", arguments, fun.okFlag);
                                };
                                if ('onKO' in fun) (fun.args || fun.params || (fun.args = []))[parseInt(fun.onKO, 10) || 0] = function () {
                                    if (resumeFun) resumeFun("koData", arguments, fun.koFlag);
                                };
                                ns.exec(_ns, fun, resumeFun, level);
                                break;
                            } else if (false === (ns.exec(_ns, fun, null, level))) {
                                resume = j;
                                break;
                            }
                        }
                    }
                    if (resume == j) resume = recursive = null;
                    return irtn;
                };
            if (!innerE) {
                xui._debugGroup("pseudo", xui.str.repeat('  ', (level || 1) - 1), '"' + fromtag + '"', {pseudo: pseudo}, {scope: _ns});
                xui._debugInfo("pseudo", xui.str.repeat('  ', (level || 1) - 1), "{");
            }
            funsrtn = recursive();
            if (!innerE) {
                xui._debugInfo("pseudo", xui.str.repeat('  ', (level || 1) - 1), "}");
                xui._debugGroupEnd("pseudo", xui.str.repeat('  ', (level || 1) - 1));
            }
            if (rtn) {
                rtn = xui.adjustVar(t = rtn, _ns);
                if (!xui.isDefined(rtn)) rtn = xui.adjustVar(t);
            } else {
                // for system beforeXXX events
                rtn = funsrtn;
            }
            return rtn;
        }/*,
        toCode:function(conf, args, module,temp){
        }*/
    };
};

/*serialize/unserialize
*/
new function () {
    var M = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '\"': '\\"',
            '\\': '\\\\',
            '/': '\\/',
            '\x0B': '\\u000b'
        },
        H = {'@window': 'window', '@this': 'this'},
        // A1/A2 for avoiding IE's lastIndex problem
        A1 = /\uffff/.test('\uffff') ? /[\\\"\x00-\x1f\x7f-\uffff]/ : /[\\\"\x00-\x1f\x7f-\xff]/,
        A2 = /\uffff/.test('\uffff') ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g,
        D = /^(-\d+|\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?((?:[+-](\d{2})(\d{2}))|Z)?$/,
        E = function (t, i, a, v, m, n, p) {
            for (i in t)
                if ((a = typeof (v = t[i])) == 'string' && (v = D.exec(v))) {
                    m = v[8] && v[8].charAt(0);
                    if (m != 'Z') n = (m == '-' ? -1 : 1) * ((+v[9] || 0) * 60) + (+v[10] || 0);
                    else n = 0;
                    m = new Date(+v[1], +v[2] - 1, +v[3], +v[4], +v[5], +v[6], +v[7] || 0);
                    n += m.getTimezoneOffset();
                    if (n) m.setTime(m.getTime() + n * 60000);
                    t[i] = m;
                } else if (a == 'object' && t[i] && (xui.isObj(t[i]) || xui.isArr(t[i]))) E(t[i]);
            return t;
        },

        F = 'function',
        N = 'number',
        L = 'boolean',
        S = 'string',
        O = 'object',
        T = {},
        PS = function (v, n) {
            return ("000" + (v || 0)).slice(-n)
        },
        Z = (function (a, b) {
            a = -(new Date).getTimezoneOffset() / 60;
            b = a > 0 ? '+' : '-';
            a = '' + Math.abs(a);
            return b + (a.length == 1 ? '0' : '') + a + '00'
        })();

    T['undefined'] = function () {
        return 'null'
    };
    T[L] = function (x) {
        return String(x)
    };
    T[N] = function (x) {
        return ((x || x === 0) && isFinite(x)) ? String(x) : 'null'
    };
    T[S] = function (x) {
        return H[x] ||
            '"' +
            (
                A1.test(x)
                    ?
                    x.replace(A2, function (a, b) {
                        if (b = M[a]) return b;
                        return '\\u' + ((b = a.charCodeAt()) < 16 ? '000' : b < 256 ? '00' : b < 4096 ? '0' : '') + b.toString(16)
                    })
                    :
                    x
            )
            + '"'
    };
    T[O] = function (x, filter, dateformat, deep, max, MAXL, MAXS) {
        var map = {
            prototype: 1,
            constructor: 1,
            toString: 1,
            valueOf: 1,
            toLocaleString: 1,
            propertyIsEnumerable: 1,
            isPrototypeOf: 1,
            hasOwnProperty: 1
        };
        deep = deep || 1;
        max = max || 0;
        MAXL = MAXL || xui.SERIALIZEMAXLAYER;
        MAXS = MAXS || xui.SERIALIZEMAXSIZE;
        if (deep > MAXL || max > MAXS) return xui.$_outofmilimted;
        max++;
        if (x) {
            var a = [], b = [], f, i, l, v;
            if (x === window) return "window";
            if (x === document) return "document";
            //for ie alien
            if ((typeof x == O || typeof x == F) && !xui.isFun(x.constructor))
                return x.nodeType ? "document.getElementById('" + x.id + "')" : "$alien";
            else if (xui.isArr(x)) {
                a[0] = '[';
                l = x.length;
                for (i = 0; i < l; ++i) {
                    if (typeof filter == 'function' && false == filter.call(x, x[i], i, b)) continue;

                    if (xui.isNaN(v = x[i])) b[b.length] = "NaN";
                    else if (xui.isNull(v)) b[b.length] = "null";
                    else if (!xui.isDefined(v)) b[b.length] = "undefined";
                    else if (f = T[typeof v]) {
                        if (typeof (v = f(v, filter, dateformat, deep + 1, max, MAXL, MAXS)) == S)
                            b[b.length] = v;
                    }
                }
                a[2] = ']';
            } else if (xui.isDate(x)) {
                if (dateformat == 'utc')
                    return '"' + PS(x.getUTCFullYear(), 4) + '-' +
                        PS(x.getUTCMonth() + 1, 2) + '-' +
                        PS(x.getUTCDate(), 2) + 'T' +
                        PS(x.getUTCHours(), 2) + ':' +
                        PS(x.getUTCMinutes(), 2) + ':' +
                        PS(x.getUTCSeconds(), 2) + '.' +
                        PS(x.getUTCMilliseconds(), 3) +
                        'Z"';
                else if (dateformat == 'gmt')
                    return '"' + PS(x.getFullYear(), 4) + '-' +
                        PS(x.getMonth() + 1, 2) + '-' +
                        PS(x.getDate(), 2) + 'T' +
                        PS(x.getHours(), 2) + ':' +
                        PS(x.getMinutes(), 2) + ':' +
                        PS(x.getSeconds(), 2) + '.' +
                        PS(x.getMilliseconds(), 3) +
                        Z + '"';
                else
                    return 'new Date(' + [x.getFullYear(), x.getMonth(), x.getDate(), x.getHours(), x.getMinutes(), x.getSeconds(), x.getMilliseconds()].join(',') + ')';
            } else if (xui.isReg(x)) {
                return String(x);
            } else {
                if (typeof x.serialize == F)
                    x = x.serialize();
                if (typeof x == O) {
                    if (x.nodeType) {
                        return "document.getElementById('" + x.id + "')";
                    } else {
                        a[0] = '{';
                        for (i in x) {
                            if (map[i] ||
                                (filter === true ? i.charAt(0) == '_' : typeof filter == 'function' ? false === filter.call(x, x[i], i, b) : 0))
                                continue;
                            if (xui.isNaN(v = x[i])) b[b.length] = T.string(i) + ':' + "NaN";
                            else if (xui.isNull(v)) b[b.length] = T.string(i) + ':' + "null";
                            else if (!xui.isDefined(v)) b[b.length] = T.string(i) + ':' + "undefined";
                            else if (f = T[typeof v]) {
                                if (typeof (v = f(v, filter, dateformat, deep + 1, max, MAXL, MAXS)) == S)
                                    b[b.length] = T.string(i) + ':' + v;
                            }
                        }
                        a[2] = '}';
                    }
                } else return String(x);
            }
            a[1] = b.join(', ');
            return a[0] + a[1] + a[2];
        }
        return 'null'
    };
    T[F] = function (x) {
        return x.$path ? x.$path : String(x)
    };

    xui.$_outofmilimted = '"\x01...\x01"';

    //serialize object to string (bool/string/number/array/hash/simple function)
    xui.serialize = function (obj, filter, dateformat, MAXL, MAXS) {
        return xui.isNaN(obj) ? "NaN" :
            xui.isNull(obj) ? "null" :
                !xui.isDefined(obj) ? "undefined" :
                    T[typeof obj](obj, filter, xui.getDateFormat(dateformat), 0, 0, MAXL, MAXS) || '';
    };
    xui.stringify = function (obj, filter, dateformat, MAXL, MAXS) {
        return xui.fromUTF8(xui.serialize(obj, filter, xui.getDateFormat(dateformat), 0, 0, MAXL, MAXS));
    };
    // for safe global
    var safeW;
    //unserialize string to object
    xui.unserialize = function (str, dateformat) {
        if (typeof str != "string") return str;
        if (!str) return false;
        if (!safeW) {
            var ifr = document.createElement(xui.browser.ie && xui.browser.ver < 9 ? "<iframe>" : "iframe"), w;
            document.body.appendChild(ifr);
            w = frames[frames.length - 1].window;
            safeW = {};
            for (var i in w) safeW[i] = null;
            document.body.removeChild(ifr);
        }
        str = '({_:(function(){with(this){return ' + str + '}}).call(safeW)})';
        try {
            str = eval(str);
        } catch (e) {
            return false;
        }
        if (xui.getDateFormat(dateformat)) E(str);
        str = str._;
        return str;
    };
};

/*26 based id, some number id can crash opera9
*/
new function () {
    xui.id = function () {
        var self = this;
        if (self.constructor !== xui.id || self.a)
            return (xui.id._ || (xui.id._ = new xui.id)).next();
        self.a = [-1];
        self.b = [''];
        self.value = '';
    };
    xui.id.prototype = {
        constructor: xui.id,
        _chars: "abcdefghijklmnopqrstuvwxyz".split(''),
        next: function (i) {
            with (this) {
                i = (i || i === 0) ? i : b.length - 1;
                var m, k, l;
                if ((m = a[i]) >= 25) {
                    m = 0;
                    if (i === 0) {
                        a.splice(0, 0, 1);
                        b.splice(0, 0, 'a');
                        l = a.length;
                        for (k = 1; k < l; ++k) {
                            a[k] = 0;
                            b[k] = '0';
                        }
                        ++i;
                    } else
                        next(i - 1);
                } else ++m;
                a[i] = m;
                b[i] = _chars[m];
                return value = b.join('');
            }
        }
    };
};


// Some basic Classes

/* xui.Thread
    Dependencies: xui
    parameters:
        id: id of this thread, if input null, thread will create a new id
        tasks: [task,task,task ...] or [{},{},{} ...]
            task: function
            or
            {
              task,      //function
              args,      //args array for task
              scope,     //this object for task
              delay ,    //ms number
              callback   //function for callback
           }
        delay:default delay time;
        callback:default calback function;
        onStart: on start function
        onEnd: on end function
        cycle: is the thread circular
*/
xui.Class('xui.Thread', null, {
    Constructor: function (id, tasks, delay, callback, onStart, onEnd, cycle) {
        var upper = arguments.callee.upper;
        if (upper) upper.call(this);
        upper = null;
        //for api call directly
        var self = this, me = arguments.callee, t = xui.$cache.thread;
        // xui.Thread() => self.constructor!==me
        // in an inner method => !!self.id is true
        if (self.constructor !== me || !!self.id)
            return new me(id, tasks, delay, callback, onStart, onEnd, cycle);

        if (typeof id != 'string') id = '$' + (self.constructor.$xid++);
        self.id = id;
        //thread profile
        self.profile = t[id] || (t[id] = {
            id: id,
            _start: false,
            time: 0,
            _left: 0,
            _asy: 0.1,
            //sleep_flag:-1,
            index: 0,

            tasks: tasks || [],
            delay: delay || 0,
            callback: callback,
            onStart: onStart,
            onEnd: onEnd,
            cache: {},
            status: "ini",
            cycle: !!cycle,
            instance: self
        });
    },
    Instance: {
        _fun: xui.fun(),
        __gc: function () {
            var m = xui.$cache.thread, t = m[this.id];
            if (t) {
                delete m[this.id];
                t.tasks.length = 0;
                for (var i in t) t[i] = null;
            }
        },
        _task: function () {
            var self = this, p = self.profile;

            // maybe abort or no task
            if (!p || !p.status || !p.tasks)
                return;
            // reset the asy flag
            p._asy = 0.1;

            var t = {}, value = p.tasks[p.index], r, i, type = typeof value;

            //function
            if (type == 'function') t.task = value;
            //hash
            else if (type == 'object')
                for (i in value) t[i] = value[i];

            //default callback
            if (typeof t.callback != 'function')
                t.callback = p.callback

            if (typeof t.task == 'function') {
                t.args = t.args || [];
                //last arg is threadid
                t.args.push(p.id);
            }

            // to next pointer
            p.index++;
            p.time = xui.stamp();

            // the real task
            if (typeof t.task == 'function') {
                r = xui.tryF(t.task, t.args || [p.id], t.scope || self, null);
            }

            // maybe abort called in abover task
            if (!p.status)
                return;

            // cache return value
            if (t.id)
                p.cache[t.id] = r;

            // if callback return false, stop.
            if (t.callback && false === xui.tryF(t.callback, [p.id], self, true))
                return self.abort('callback');
            // if set suspend at t.task or t.callback , stop continue running
            if (p.status !== "run")
                return;

            self.start();
        },
        start: function (time, delaycb) {
            var self = this, p = self.profile;

            if (p.__delaycb) {
                xui.tryF(p.__delaycb, [p.id], self);
                delete p.__delaycb;
            }
            if (delaycb) {
                p.__delaycb = delaycb;
            }

            if (p._start === false) {
                p._start = true;
                //call onstart
                if (p.onStart) {
                    var r = xui.tryF(p.onStart, [p.id], self);
                    if (false === r) {
                        return self.abort('start');
                    } else if (true === r) {
                        return;
                    } else if (xui.isNumb(r)) {
                        self.suspend(r);
                        return;
                    }
                }
            }

            p.status = "run";

            if (!p.tasks.length)
                return self.abort('empty');

            if (p.index >= p.tasks.length) {
                if (p.cycle === true)
                    self.profile.index = 0;
                else
                    return self.abort('normal');
            }
            var task = p.tasks[p.index],
                delay = typeof task == 'number' ? task : (task && typeof task.delay == 'number') ? task.delay : p.delay;

            p._left = (time || time === 0) ? time : delay;

            // clear the mistake trigger task
            if (p._asy != 0.1)
                xui.clearTimeout(p._asy);

            p._asy = xui.asyRun(self._task, p._left, [], self);
            p.time = xui.stamp();
            return self;
        },
        suspend: function (time, delaycb) {
            var n, p = this.profile;
            if (p.status == "pause") return;
            p.status = "pause";

            if (p._asy !== 0.1) {
                xui.clearTimeout(p._asy);
                if (p.index > 0) p.index--;
            }
            n = p._left - (xui.stamp() - p.time);

            p._left = (n >= 0 ? n : 0);

            if ((Number(time) || 0))
                this.resume(time, delaycb);

            return this;
        },
        /*time
        number:set timeout to number
        true:set timeout to default
        false:set timeout to 0
        undefined: timetou to left
        */
        resume: function (time, delaycb) {
            var self = this, p = self.profile;
            if (p.status == "run") return self;

            time = time === undefined ? p._left :
                time === true ? p.delay :
                    time === false ? 0 :
                        (Number(time) || 0);

            p.status = "run";
            self.start(time, delaycb);
            return self;
        },
        abort: function (flag) {
            var self = this, p = self.profile;
            if (p.status == "stop") return;
            p.status = "stop";

            var onEnd = p.onEnd, id = p.id;
            xui.clearTimeout(p._asy);
            this.__gc();
            // at last
            xui.tryF(onEnd, [id, flag]);
        },
        links: function (thread) {
            var p = this.profile, onEnd = p.onEnd, id = p.id;
            p.onEnd = function (tid, flag) {
                xui.tryF(onEnd, [tid, flag]);
                thread.start()
            };
            return this;
        },
        insert: function (arr, index) {
            var self = this, o = self.profile.tasks, l = o.length, a;
            if (!xui.isArr(arr)) arr = [arr];
            index = index || self.profile.index;
            if (index < 0) index = -1;
            if (index == -1) {
                Array.prototype.push.apply(o, arr);
            } else {
                if (index > l) index = l;
                a = o.splice(index, l - index);
                o.push.apply(o, arr);
                o.push.apply(o, a);
            }
            return self;
        },
        getCache: function (key) {
            return this.profile.cache[key];
        },
        setCache: function (key, value) {
            this.profile.cache[key] = value;
            return this;
        },
        isAlive: function () {
            return !!xui.$cache.thread[this.id];
        },
        getStatus: function () {
            return this.profile.status;
        }
    },
    After: function () {
        /*
        give shortcut to some functions
        only for the existing thread
        */
        var self = this, f = function (i) {
                self[i] = function (id) {
                    var t;
                    if (xui.$cache.thread[id])
                        return (t = xui.Thread(id))[i].apply(t, Array.prototype.slice.call(arguments, 1));
                }
            },
            a = 'start,suspend,resume,abort,links,insert,isAlive,getStatus'.split(',');
        for (var i = 0, l = a.length; i < l; i++) f(a[i]);
    },
    Static: {
        $asFunction: 1,
        $xid: 1,
        __gc: function () {
            xui.$cache.thread = {};
        },
        get: function (id) {
            id = xui.$cache.thread[id];
            return id && id.instance;
        },
        isAlive: function (id) {
            return !!xui.$cache.thread[id];
        },
        //Dependencies: xui.Dom
        observableRun: function (tasks, onEnd, threadid, busyMsg) {
            var thread = xui.Thread, dom = xui.Dom;
            if (!xui.isArr(tasks)) tasks = [tasks];
            //if thread exists, just inset task to the next positiong
            if (xui.$cache.thread[threadid]) {
                if (typeof onEnd == 'function')
                    tasks.push(onEnd);
                thread.insert(threadid, tasks);
                //if does not exist, create a new thread
            } else {
                thread(threadid, tasks,
                    0, null,
                    //set busy status to UI
                    function (threadid) {
                        if (dom) dom.busy(threadid, busyMsg);
                    },
                    //set free status to UI
                    function (threadid) {
                        xui.tryF(onEnd, arguments, this);
                        if (dom) dom.free(threadid);
                    }
                ).start();
            }
        },
        /*group thread run once
        group: hash include thread or threadid
        callback: call after a thread finish
        onStart:before all threads start
        onEnd:after all threads end
        */
        group: function (id, group, callback, onStart, onEnd) {
            var bak = {},
                thread = xui.Thread,
                f = function (o, i, threadid) {
                    if (typeof o == 'string') o = thread(o);
                    if (o) {
                        var f = function () {
                            var me = arguments.callee;
                            xui.tryF(me.onEnd, arguments, this);
                            me.onEnd = null;
                            delete bak[i];
                            //call callback here
                            xui.tryF(callback, [i, threadid], this);
                            if (xui.isEmpty(bak))
                                thread.resume(threadid);
                        };
                        f.onEnd = o.profile.onEnd;
                        o.profile.onEnd = f;
                        o.start();
                    }
                };
            for (var i in group) bak[i] = 1;
            return thread(id, [function (threadid) {
                if (!xui.isEmpty(group)) {
                    thread.suspend(threadid);
                    for (var i in group) f(group[i], i, threadid);
                }
            }], 0, null, onStart, onEnd);
        },
        repeat: function (task, interval, onStart, onEnd) {
            return xui.Thread(null, [null], interval || 0, task, onStart, onEnd, true).start();
        }
    }
});

/*xui.absIO/ajax
    Dependencies: xui.Thread

            get     post    get(cross domain)   post(corss domain)  post file   return big data(corss domain)
    ajax    +       +       -                   -                   -           -
    sajax   +       -       +                   -                   -           * JSONP
    iajax   +       +       +                   *                   *           * IDMI
*/
xui.Class('xui.absIO', null, {
    Constructor: function (uri, query, onSuccess, onFail, threadid, options) {
        var upper = arguments.callee.upper;
        if (upper) upper.call(this);
        upper = null;
        //get properties
        if (typeof uri == 'object')
            options = uri;
        else {
            options = options || {};
            xui.merge(options, {
                uri: uri,
                query: query,
                onSuccess: onSuccess,
                onFail: onFail,
                threadid: threadid
            });
        }
        //for cache
        var self = this, me = arguments.callee, con = self.constructor;
        if ((con !== me) || self.id)
            return new me(options);

        //give defalut value to those members
        xui.merge(options, {
            id: options.id || ('' + (con._id++)),
            uid: ('' + (con.uid++)),
            uri: options.uri ? xui.adjustRes(options.uri, 0, 1, 1) : '',
            username: options.username || undefined,
            password: options.password || undefined,
            query: options.query || '',
            contentType: options.contentType || '',
            Accept: options.Accept || '',
            header: options.header || null,
            asy: options.asy !== false
        }, 'all');
        var m = (options.method || con.method).toUpperCase();
        options.method = 'POST' == m ? 'POST' : 'PUT' == m ? 'PUT' : 'DELETE' == m ? 'DELETE' : 'PATCH' == m ? 'PATCH' : 'GET';

        var a = 'retry,timeout,reqType,rspType,optimized,customQS'.split(',');
        for (var i = 0, l = a.length; i < l; i++) {
            options[a[i]] = (a[i] in options) ? options[a[i]] : con[a[i]];
            if (typeof options[a[i]] == "string")
                options[a[i]] = options[a[i]].toLowerCase();
        }

        xui.merge(self, options, 'all');

        if (self.reqType == 'xml')
            self.method = "POST";

        if (con.events)
            xui.merge(self, con.events);

        self.query = self.customQS(self.query, options && options.exData);

        // remove all undefined item
        if (typeof self.query == 'object' && self.reqType != "xml")
            self.query = xui.copy(self.query, function (o) {
                return o !== undefined
            });

        if (!self._useForm && xui.isHash(self.query) && self.reqType != "xml")
            self.query = con._buildQS(self.query, self.reqType == "json", self.method == 'POST');

        return self;
    },
    Instance: {
        _fun: xui.fun(),
        _flag: 0,
        _response: false,
        _txtresponse: '',
        _retryNo: 0,

        _time: function () {
            var self = this, c = self.constructor;
            self._clear();
            if (self._retryNo < self.retry) {
                self._retryNo++;
                xui.tryF(self.onRetry, [self._retryNo], self);
                self.start();
            } else {
                if (false !== xui.tryF(self.onTimeout, [], self))
                    self._onError(new Error("Request timeout"));
            }
        },
        _onEnd: function () {
            var self = this;
            if (!self._end) {
                self._end = true;
                if (self._flag > 0) {
                    xui.clearTimeout(self._flag);
                    self._flag = 0
                }
                xui.Thread.resume(self.threadid);
                xui.tryF(self.$onEnd, [], self);
                xui.tryF(self.onEnd, [], self);
                self._clear();
            }
        },
        _onStart: function () {
            var self = this;
            xui.Thread.suspend(self.threadid);
            xui.tryF(self.$onStart, [], self);
            xui.tryF(self.onStart, [], self);
        },
        _onResponse: function () {
            var self = this;
            if (false !== xui.tryF(self.beforeSuccess, [self._response, self.rspType, self.threadid], self))
                xui.tryF(self.onSuccess, [self._response, self.rspType, self.threadid], self);
            self._onEnd();
        },
        _onError: function (e) {
            var self = this;
            if (false !== xui.tryF(self.beforeFail, [e, self.threadid], self))
                xui.tryF(self.onFail, [e.name ? (e.name + ": " + e.message) : e, self.rspType, self.threadid, e], self);
            self._onEnd();
        },
        isAlive: function () {
            return !this._end;
        },
        abort: function () {
            this._onEnd();
        }
    },
    Static: {
        $abstract: true,
        get: function (uri, query, onSuccess, onFail, threadid, options) {
            options = options || {};
            options.method = "GET";
            return this.apply(this, arguments).start();
        },
        post: function (uri, query, onSuccess, onFail, threadid, options) {
            options = options || {};
            options.method = "POST";
            return this.apply(this, arguments).start();
        },
        _id: 1,
        uid: 1,
        method: 'GET',
        retry: 0,
        timeout: 60000,
        //form, xml, or json
        reqType: 'form',
        //json, xml, text, script
        rspType: 'json',

        optimized: false,

        callback: 'callback',

        _buildQS: function (hash, flag, post) {
            hash = xui.clone(hash, function (o, i) {
                return !(xui.isNaN(o) || !xui.isDefined(o))
            });
            return flag ? ((flag = xui.serialize(hash)) && (post ? flag : encodeURIComponent(flag))) : xui.urlEncode(hash);
        },
        customQS: function (obj, ex) {
            if (ex) {
                if (typeof obj == 'string') {
                    obj = (obj || "") + "&" + xui.urlEncode(ex);
                } else {
                    xui.merge(obj, ex, 'all');
                }
            }
            return obj;
        },
        _if: function (doc, id, onLoad) {
            var ie8 = xui.browser.ie && xui.browser.ver < 9,
                scr = ie8
                    ? ("<iframe " + (id ? ("name='" + "xui_xdmi:" + id + "'") : "") + (onLoad ? (" onload='xui.XDMI._o(\"" + id + "\")'") : "") + ">")
                    : "iframe";
            var n = doc.createElement(scr), w;
            if (id) n.id = n.name = "xui_xdmi:" + id;
            if (!ie8 && onLoad) n.onload = onLoad;
            n.style.display = "none";
            doc.body.appendChild(n);
            w = frames[frames.length - 1].window;
            return [n, w, w.document];
        },
        isCrossDomain: function (uri) {
            var b = xui._localParts;
            uri = uri.replace(/#.*$/, "").replace(/^\/\//, b[1] + "//");
            var a = xui._uriReg.exec((uri || '').toLowerCase());
            return !!(a && (
                    a[1] !== b[1] ||
                    a[2] !== b[2] ||
                    (a[3] || (a[1] === "http:" ? 80 : 443)) !== (b[3] || (b[1] === "http:" ? 80 : 443))
                )
            );
        },
        //get multi ajax results once
        groupCall: function (hash, callback, onStart, onEnd, threadid) {
            var i, f = function (o, i, hash) {
                hash[i] = xui.Thread(null, [function (threadid) {
                    o.threadid = threadid;
                    o.start();
                }]);
            };
            for (i in hash) f(hash[i], i, hash);
            return xui.Thread.group(null, hash, callback, function () {
                xui.Thread.suspend(threadid);
                xui.tryF(onStart, arguments, this);
            }, function () {
                xui.tryF(onEnd, arguments, this);
                xui.Thread.resume(threadid);
            }).start();
        }
    }
});
// AJAX
xui.Class('xui.Ajax', 'xui.absIO', {
    Instance: {
        _XML: null,
        _unsafeHeader: "Accept-Charset,Accept-Encoding,Access-Control-Request-Headers,Access-Control-Request-Method,Connection,Content-Length,Cookie,Cookie2,Date,DNT,Expect,Host,Keep-Alive,Origin,Referer,TE,Trailer,Transfer-Encoding,Upgrade,User-Agent,Via".toLowerCase().split(","),
        _isunsafe: function (k) {
            return xui.browser.isWebKit && (xui.str.startWith("Proxy-", k) || xui.str.startWith("Sec-", k) || xui.arr.indexOf(this._unsafeHeader, k.toLowerCase()) !== -1);
        },
        _header: function (n, v) {
            if (!this._isunsafe(n)) {
                if (this._XML) this._XML.setRequestHeader(n, v);
            }
        },
        start: function () {
            var self = this;
            if (false === xui.tryF(self.beforeStart, [], self)) {
                self._onEnd();
                return;
            }
            if (!self._retryNo)
                self._onStart();
            try {
                with (self) {
                    //must use "self._XML", else opera will not set the new one
                    self._XML = new window.XMLHttpRequest();
                    if (asy)
                        self._XML.onreadystatechange = function () {
                            if (self && self._XML && self._XML.readyState == 4) {
                                /*//Checking responseXML for Terminated unexpectedly in firfox
                               if(xui.browser.gek && !self._XML.responseXML)
                                    self._onError(new Error('errXMLHTTP:Terminated unexpectedly!'));
                               else*/
                                self._complete.apply(self);
                                //must clear here, else memory leak
                                self._clear();
                            }
                        };

                    if (!_retryNo && method != "POST") {
                        if (query)
                            uri = uri.split("?")[0] + "?" + query;
                        query = null;
                    }
                    if (username && password)
                        self._XML.open(method, uri, asy, username, password);
                    else
                        self._XML.open(method, uri, asy);

                    self._header("Accept", Accept ? Accept :
                        (rspType == 'json' ? "application/json,text/javascript,*/*;q=0.01" : rspType == 'xml' ? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" : "*/*")
                    );
                    self._header("Content-Type", contentType ? contentType : (
                        (reqType == 'xml' ? "text/xml; " : reqType == 'json' ? "application/json; " : method == "POST" ? "application/x-www-form-urlencoded; " : "") + "charset=" + (self.charset || "UTF-8")
                    ));
                    self._header("X-Requested-With", "XMLHttpRequest");
                    if (optimized) {
                        try {
                            self._header("User-Agent", null);
                            self._header("Accept-Language", null);
                            self._header("Connection", "keep-alive");
                            self._header("Keep-Alive", null);
                            self._header("Cookie", null);
                            self._header("Cookie", "");
                        } catch (e) {
                        }
                    }
                    try {
                        if (xui.isHash(header))
                            xui.each(header, function (o, i) {
                                self._header(i, o);
                            });
                    } catch (e) {
                    }

                    if (false === xui.tryF(self.beforeSend, [self._XML], self)) {
                        self._onEnd();
                        return;
                    }

                    //for firefox syc GET bug
                    try {
                        self._XML.send(query);
                    } catch (e) {
                    }

                    if (asy) {
                        if (self._XML && timeout > 0)
                            _flag = xui.asyRun(function () {
                                if (self && !self._end) {
                                    self._time()
                                }
                            }, self.timeout);
                    } else
                        return _complete();
                }
            } catch (e) {
                self._onError(e);
            }
            return self;
        },
        abort: function () {
            var self = this;
            if (self._XML) {
                self._XML.onreadystatechange = self._fun;
                self._XML.abort();
                self._XML = null;
            }
            arguments.callee.upper.call(self);
        },
        _clear: function () {
            var self = this;
            if (self._XML) {
                self._XML.onreadystatechange = self._fun;
                self._XML = null;
            }
        },
        _complete: function () {
            with (this) {
                //this is for opera
                var ns = this, obj, status = ns._XML.status;
                _txtresponse = rspType == 'xml' ? ns._XML.responseXML : ns._XML.responseText;
                // try to get js object, or the original
                _response = rspType == "json" ?
                    /^\s*\</.test(_txtresponse) && (obj = xui.XML.xml2json(xui.XML.parseXML(_txtresponse))) && obj.data ? obj.data
                        : ((obj = xui.unserialize(_txtresponse)) === false ? _txtresponse : obj)
                    : _txtresponse;

                // crack for some local case ( OK but status is 0 in no-IE browser)
                if (!status && xui._localReg.test(xui._localParts[1])) {
                    status = ns._XML.responseText ? 200 : 404;
                }

                // for IE7
                if (status == 1223) status = 204;

                if (status >= 200 && status < 300 || status == 304)
                    _onResponse();
                // offline or other Network problems
                else if (status === undefined || status < 10)
                    _onError(new Error('Network problems--' + status));
                else
                    _onError(new Error('XMLHTTP returns--' + status));
            }
            return this._response;
        }
    },
    Static: {
        $asFunction: 1
    }
});

// JSONP
xui.Class('xui.JSONP', 'xui.absIO', {
    Instance: {
        start: function () {
            var self = this, id, c = self.constructor, t, n, ok = false;
            if (false === xui.tryF(self.beforeStart, [], self)) {
                self._onEnd();
                return;
            }
            if (!self._retryNo)
                self._onStart();
            //dont retry for loading script
            if (self.rspType == 'script')
                self.retry = 0;

            //first
            id = self.id;
            if (c._pool[id])
                c._pool[id].push(self);
            else
                c._pool[id] = [self];

            c.No["_" + id] = function (rsp) {
                c.$response(rsp, id);
            };

            var w = document,
                _cb = function () {
                    if (!ok) {
                        ok = true;
                        if (self.rspType == 'script') {
                            if (typeof self.checkKey == 'string')
                                xui.setTimeout(function () {
                                    xui.exec("!function(t){"
                                        + "if(t=xui.get(xui.JSONP,['_pool','" + id + "',0])) {"
                                        + "if(xui.SC.get('" + self.checkKey + "'))t._onResponse();"
                                        + "else t._loaded();"
                                        + "}"
                                        + "}()");
                                    // ensure using setTimeout, for the case:
                                    //    When the page loading, if you switch to the other page, and return back after timeout, the xui.JSONP._pool["1"] will be deleted
                                    //    In this case: setTimeout will be executed first (it'll clear the JSONP), and requestAnimationFrame will be executed later
                                }, false);
                            else
                                self._onResponse();
                        } else
                            self._loaded();
                    }
                };
            n = self.node = w.createElement("script");

            var uri = self.uri;
            if (self.query)
                uri = uri.split("?")[0] + "?" + self.query;

            n.src = uri;
            n.type = 'text/javascript';
            n.charset = self.charset || 'UTF-8';
            n.onload = n.onreadystatechange = function () {
                if (ok)
                    return;
                var t = this.readyState;
                if (!t || t == "loaded" || t == "complete")
                    _cb();

                if (t == 'interactive' && xui.browser.opr) {
                    xui.Thread.repeat(function () {
                        if (ok)
                            return false;
                        if (/loaded|complete/.test(document.readyState)) {
                            _cb();
                            return false;
                        }
                    }, 50);
                }
            };

            if ('onerror' in n)
                n.onerror = function (e) {
                    //clear first
                    self._clear();
                    self._onError(new Error("Not Found - " + uri));
                    self = null;
                    return;
                };

            (w.body || w.getElementsByTagName("head")[0]).appendChild(n);

            n = null;

            //set timeout
            if (self.timeout > 0)
                self._flag = xui.asyRun(function () {
                    if (self && !self._end) {
                        self._time()
                    }
                }, self.timeout);
        },
        _clear: function () {
            var self = this, n = self.node, c = self.constructor, id = self.id, _pool = c._pool;
            if (_pool[id]) {
                _pool[id].length = 0;
                delete _pool[id];
            }
            delete c.No["_" + id];

            if (n) {
                self.node = n.onload = n.onreadystatechange = n.onerror = null;

                var div = document.createElement('div');
                //in ie + add script with url(remove script immediately) + add the same script(remove script immediately) => crash
                //so, always clear it later
                div.appendChild(n.parentNode && n.parentNode.removeChild(n) || n);
                if (xui.browser.ie)
                    xui.asyRun(function () {
                        div.innerHTML = n.outerHTML = '';
                        if (xui.isEmpty(_pool)) c._id = 1;
                        _pool = c = n = div = null;
                    });
                else {
                    xui.asyRun(function () {
                        div.innerHTML = '';
                        n = div = null;
                        if (xui.isEmpty(_pool)) c._id = 1;
                    });
                }
            } else {
                if (xui.isEmpty(_pool)) c._id = 1;
            }
        },
        _loaded: function () {
            var self = this;
            xui.asyRun(function () {
                if (self.id && self.constructor._pool[self.id])
                    self._onError(new Error("JSONP return script doesn't match"));
            }, 500);
        }
    },
    Static: {
        $asFunction: 1,
        _pool: {},
        "No": {},
        $response: function (obj, id) {
            var self = this, o;
            if (obj && (o = self._pool[id])) {
                for (var i = 0, l = o.length; i < l; i++) {
                    o[i]._response = obj;
                    o[i]._onResponse();
                }
            } else
                self._onError(new Error("JSONP return value formatting error--" + obj));
        },
        customQS: function (obj, ex) {
            var c = this.constructor, b = c.callback, nr = (this.rspType != 'script'), r;
            if (typeof obj == 'string') {
                obj = (obj || "") + (nr ? ("&" + b + '=xui.JSONP.No._' + this.id) : '');
                if (ex) obj = (obj || "") + (nr ? ("&" + xui.urlEncode(ex)) : '');
            } else {
                if (nr) {
                    obj[b] = "xui.JSONP.No._" + this.id;
                    if (ex) xui.merge(obj, ex, 'all');
                }
            }
            return obj;
        }
    }
});

// XDMI : Cross-Domain Messaging with iframes
xui.Class('xui.XDMI', 'xui.absIO', {
    Instance: {
        _useForm: true,
        start: function () {
            var self = this, w = window, c = self.constructor, i, id, t, n, k, o, b, form, onload;
            if (false === xui.tryF(self.beforeStart, [], self)) {
                self._onEnd();
                return;
            }
            if (!self._retryNo)
                self._onStart();

            //first
            id = self.id;
            if (c._pool[id])
                c._pool[id].push(self);
            else
                c._pool[id] = [self];

            //create form
            var a = c._if(document, id, onload);
            self.node = a[0];
            self.frm = a[1];
            //create form
            form = self.form = document.createElement('form');
            form.style.display = 'none';

            // use postmessage
            if (w['postMessage']) {
                self._msgcb = function (e) {
                    if (!self.node) return;
                    // only take self message
                    if (e.source !== self.frm) {
                        return;
                    }
                    e = e.data;
                    if (self.rspType == "json") {
                        e = xui.unserialize(e) || e;
                    }
                    if (e && (t = c._pool[self.id])) {
                        for (var i = 0, l = t.length; i < l; i++) {
                            t[i]._response = e;
                            t[i]._onResponse();
                        }
                    } else {
                        //clear first
                        self._clear();
                        self._onError(new Error("XDMI return value formatting error"));
                    }
                };
                if (w.addEventListener) w.addEventListener('message', self._msgcb, false);
                else w.attachEvent('onmessage', self._msgcb);
            }
            // use window.name
            else {
                self._onload = onload = function (id) {
                    //in some situation, this function will be triggered twice.
                    if (self.OK) return;
                    //in IE/opera, "setting an image file as dummy" will trigger the second onload event with 'self.node == null'
                    if (!self.node) return;
                    var w = self.node.contentWindow, c = xui.XDMI, o, t;
                    //in opera, "set location" will trigger location=='about:blank' at first
                    if (xui.browser.opr) try {
                        if (w.location == 'about:blank') return
                    } catch (e) {
                    }
                    self.OK = 1;
                    // first round: try to syn domain
                    var flag = 0;
                    try {
                        if (w.name === undefined) flag = 1
                    } catch (e) {
                        flag = 1
                    }
                    if (flag) {
                        w.location.replace(c._getDummy() + '#' + xui.ini.dummy_tag);
                    }

                    // get data
                    var getData = function () {
                        // second round: try to get data
                        var flag = 0;
                        try {
                            if (w.name === undefined) flag = 1
                        } catch (e) {
                            flag = 1
                        }
                        if (flag) {
                            return xui.asyRun(getData);
                        }

                        var data;
                        if (("xui_xdmi:" + self.id) == w.name) {
                            //clear first
                            self._clear();
                            self._onError(new Error('XDMI no return value'));
                            return;
                        } else {
                            data = w.name;
                        }

                        if (data && (o = xui.unserialize(data)) && (t = c._pool[self.id])) {
                            for (var i = 0, l = t.length; i < l; i++) {
                                t[i]._response = o;
                                t[i]._onResponse();
                            }
                        } else {
                            //clear first
                            self._clear();
                            self._onError(new Error("XDMI return value formatting error, or no matched 'id'-- " + data));
                        }
                    };
                    getData();
                };
            }

            var uri = self.uri;
            if (self.method != 'POST')
                uri = uri.split("?")[0];

            form.action = self.uri;
            form.method = self.method;
            form.target = "xui_xdmi:" + id;

            k = self.query || {};
            var file, files = [];
            for (i in k) {
                if (k[i] && k[i]['xui.UIProfile'] && k[i].$xuiFileCtrl) {
                    if (file = k[i].boxing().getUploadObj()) {
                        files.push({id: k[i].$xid, file: file});
                        file.id = file.name = i;
                        form.appendChild(file);
                        b = true;
                    }
                } else if (k[i] && k[i].nodeType == 1) {
                    k[i].id = k[i].name = i;
                    form.appendChild(k[i]);
                    b = true;
                } else {
                    if (xui.isDefined(k[i])) {
                        t = document.createElement('textarea');
                        t.id = t.name = i;
                        t.value = typeof k[i] == 'string' ? k[i] : xui.serialize(k[i], function (o) {
                            return o !== undefined
                        });
                        form.appendChild(t);
                    }
                }
            }
            if (self.method == 'POST' && b) {
                form.enctype = 'multipart/form-data';
                if (form.encoding)
                    form.encoding = form.enctype;
            }
            document.body.appendChild(form);
            //submit
            form.submit();

            if (files.length) {
                xui.arr.each(files, function (o, i) {
                    if (i = xui.getObject(o.id)) {
                        if (i['xui.UIProfile'] && i.boxing() && i.boxing().setUploadObj) {
                            i.boxing().setUploadObj(o.file);
                        }
                    }
                });
            }

            t = form = null;
            //set timeout
            if (self.timeout > 0)
                self._flag = xui.asyRun(function () {
                    if (self && !self._end) {
                        self._time()
                    }
                }, self.timeout);
        },
        _clear: function () {
            var self = this, n = self.node, f = self.form, c = self.constructor, w = window,
                div = document.createElement('div'), id = self.id, _pool = c._pool;
            if (_pool[id]) {
                _pool[id].length = 0;
                delete _pool[id];
            }
            if (n && w['postMessage']) {
                if (w.removeEventListener) w.removeEventListener('message', self._msgcb, false);
                else w.detachEvent('onmessage', self._msgcb);
                self._msgcb = null;
            } else {
                if (xui.browser.gek && n) try {
                    n.onload = null;
                    var d = n.contentWindow.document;
                    d.write(" ");
                    d.close()
                } catch (e) {
                }
            }
            self.form = self.node = self.frm = null;
            if (n) div.appendChild(n.parentNode.removeChild(n));
            if (f) div.appendChild(f.parentNode.removeChild(f));
            div.innerHTML = '';
            if (xui.isEmpty(_pool)) c._id = 1;
            f = div = null;
        }
    },
    Static: {
        $asFunction: 1,
        method: 'POST',
        _pool: {},
        _o: function (id) {
            var self = this, p = self._pool[id], o = p[p.length - 1];
            xui.tryF(o._onload);
        },
        _getDummy: function (win) {
            win = win || window;
            var ns = this,
                arr, o,
                d = win.document,
                ini = xui.ini,
                b = xui.browser,
                f = ns.isCrossDomain;
            if (ns.dummy) return ns.dummy;
            //can get from xui.ini;
            if (ini.dummy) return ns.dummy = ini.dummy;
            if (!f(ini.path)) {
                //not for 'ex-domain include xui' case
                if (!d.getElementById('xui:img:bg')) {
                    o = d.createElement('img');
                    o.id = 'xui:img:bg';
                    o.src = ini.img_bg;
                    o.style.display = 'none';
                    d.body.appendChild(o);
                    o = null;
                }
            }
            if (o = d.getElementById('xui:img:bg')) {
                return ns.dummy = o.src.split('#')[0];
            } else {
                arr = d.getElementsByTagName("img");
                for (var i = 0, j = arr.length; i < j; i++) {
                    o = arr[i];
                    if (o.src && !f(o.src))
                        return ns.dummy = o.src.split('#')[0];
                }

                if (b.gek) {
                    arr = d.getElementsByTagName("link");
                    for (var i = 0, j = arr.length; i < j; i++) {
                        o = arr[i];
                        if (o.rel == "stylesheet" && !f(o.href))
                            return ns.dummy = o.href.split('#')[0];
                    }
                }
            }
            //get from parent, not for opera in this case
            try {
                if (win != win.parent)
                    if ((win = win.parent) && !f('' + win.document.location.href))
                        return ns._getDummy(win);
            } catch (e) {
            }
            //for the last change, return a file name whether it existes or does not exist, and not cache it.
            return '/favicon.ico';
        },
        customQS: function (obj, ex) {
            var s = this, c = s.constructor, t = c.callback, w = window;
            if (window['postMessage'])
                obj[t] = obj.parentDomain = w.location.origin || (w.location.protocol + "//" + w.location.hostname + (w.location.port ? ':' + w.location.port : ''));
            else
                obj[t] = 'window.name';
            if (ex) xui.merge(obj, ex, 'all');
            return obj;
        }
    }
});

new function () {
    // for compitable
    xui.SAjax = xui.JSONP;
    xui.IAjax = xui.XDMI;
};

/*xui.SC for straight call
  Dependencies: xui.Thread; xui.absIO/ajax
*/
xui.Class('xui.SC', null, {
    Constructor: function (path, callback, isAsy, threadid, options, force) {
        var upper = arguments.callee.upper;
        if (upper) upper.call(this);
        upper = null;
        var p = xui.$cache.SC, r;
        if (r = p[path] || (p[path] = xui.get(window, path.split('.'))))
            xui.tryF(callback, [path, null, threadid], r);
        else {
            options = options || {};
            options.$cb = callback;
            if (isAsy) options.threadid = threadid;
            r = p[path] = xui.SC._call(path || '', options, isAsy, force);
        }
        return r;
    },
    Static: {
        $asFunction: 1,
        __gc: function (k) {
            xui.$cache.SC = {};
        },
        // default, SC will get script from url:
        //        App.Name => ./App/Name.js
        //onSucess(text,rspType,threadid)
        //onFail(text,rspType,threadid)
        // "return false" will stop the default Ajax calling
        beforeGetScript: function (path, onSucess, onFail) {
        },
        //get object from obj string
        get: function (path, obj1, obj2, v) {
            // a[1][2].b[3] => a,1,2,b,3
            path = (path || '').replace(/\]$/g, '').split(/[\[\]\.]+/);

            if (obj1) v = xui.get(obj1, path);
            if (obj2 && v === undefined) v = xui.get(obj2, path);
            if (v === undefined) v = xui.get(window, path);
            return v;
        },
        /* function for "Straight Call"
        *   asy     loadSnips use
        *   true    true    ajax
        *   true    false   sajax JSONP
        *   false   ture    ajax
        *   false   false   ajax
        */
        _call: function (s, options, isAsy, force) {
            isAsy = !!isAsy;
            var i, t, r, o, funs = [], ep = xui.SC.get, ct = xui.$cache.snipScript,
                f = function (text, rspType, threadid) {
                    var self = this, t, uri = this.uri;
                    if (text) {
                        //test again when asy end.
                        if (!ep(s)) {
                            //loadSnips only
                            if (self.$p)
                                (self.$cache || ct)[self.$tag] = text;
                            else
                            //for sy xmlhttp ajax
                                try {
                                    xui.exec(text, s)
                                } catch (e) {
                                    throw e.name + ": " + e.message + " " + self.$tag
                                }
                        }
                    }
                    t = xui.Class._last;
                    xui.Class._ignoreNSCache = xui.Class._last = null;
                    // specified class must be in the first, maybe multi classes in code
                    // and give a change to load the last class in code, if specified class doesn't exist
                    xui.tryF(self.$cb, [self.$tag, text, threadid], ep(s) || t || {});
                    if (!ep(s) && t && t.KEY != s)
                        xui.log("[xui] > '" + s + "' doesn't in '" + uri + "'. The last class '" + t.KEY + "' was triggered.");
                }, fe = function (text, rspType, threadid) {
                    var self = this;
                    //for loadSnips resume with error too
                    xui.tryF(self.$cb, [null, null, self.threadid], self);
                };
            //get from object first
            if (force || !(r = ep(s))) {
                //if script in cache
                if (!force && (t = ct[s])) {
                    isAsy = false;
                    f.call({$cb: options.$cb}, t);
                    //delete it
                    delete ct[s];
                }
                //get from object second
                if (force || !(r = ep(s))) {
                    options = options || {};
                    //load from sy ajax
                    if (s.indexOf(".cls") > 0) {
                        o = xui.getPath(s, '.cls', '', options);
                    } else {
                        o = xui.getPath(s, '.js', '', options);
                    }

                    options.$tag = s;
                    xui.Class._ignoreNSCache = 1;
                    xui.Class._last = null;
                    var ajax;
                    //asy and not for loadSnips
                    if (isAsy && !options.$p) {
                        options.rspType = "script";
                        ajax = xui.JSONP;
                    } else {
                        options.asy = isAsy;
                        ajax = xui.Ajax;
                    }
                    //get text from sy ajax
                    if (xui.SC.beforeGetScript(o, f, fe) !== false) {
                        ajax(o, xui._rnd(), f, fe, null, options).start();
                    }
                    //for asy once only
                    if (!isAsy)
                        r = ep(s);
                }
            } else if (options.$cb)
                f.call(options);
            return r;
        },
        /*
        arr: key array, ['xui.UI.Button','xui.UI.Input']
        callback: fire this function after all js loaded
        */
        loadSnips: function (pathArr, cache, callback, onEnd, threadid, options, isAsy) {
            if (!pathArr || !pathArr.length) {
                xui.tryF(onEnd, [threadid]);
                return;
            }
            var bak = {}, options = xui.merge(options || {}, {$p: 1, $cache: cache || xui.$cache.snipScript});
            for (var i = 0, l = pathArr.length; i < l; i++)
                bak[pathArr[i]] = 1;

            if (callback || onEnd) {
                options.$cb = function (path) {
                    //give callback call
                    if (callback) xui.tryF(callback, arguments, this);
                    delete bak[path || this.$tag];
                    if (xui.isEmpty(bak)) {
                        xui.tryF(onEnd, [threadid]);
                        onEnd = null;
                        xui.Thread.resume(threadid);
                    }
                };
            }
            xui.Thread.suspend(threadid);
            for (var i = 0, s; s = pathArr[i++];)
                this._call(s, xui.merge({$tag: s}, options, isAsy), true);
        },
        runInBG: function (pathArr, callback, onStart, onEnd) {
            var i = 0, j, t, self = this, fun = function (threadid) {
                while (pathArr.length > i && (t = self.get(j = pathArr[i++]))) ;
                if (!t)
                    self._call(j, {threadid: threadid}, true);
                //set abort function to the next step
                if (pathArr.length < i)
                    xui.Thread.abort(threadid);
                if (pathArr.length == i) i++;
            };
            xui.Thread(null, [fun], 1000, callback, onStart, onEnd, true).start();
        },
        execSnips: function (cache) {
            var i, h = cache || xui.$cache.snipScript;
            for (i in h)
                try {
                    xui.exec(h[i], i)
                } catch (e) {
                    throw e
                }
            h = {};
        },
        //asy load multi js file, whatever Dependencies
        /*
        *1.busy UI
        *3.xui.SC.groupCall some js/class
        *4.resume thread
        *5.xui.SC.loadSnips other js/class
        *6.execute other ..
        *7.free UI
        */
        groupCall: function (pathArr, onEnd, callback, threadid, options, isAsy) {
            if (pathArr) {
                //clear first
                var self = this;
                self.execSnips();
                xui.Thread.suspend(threadid);
                self.loadSnips(pathArr, 0, callback, function () {
                    self.execSnips();
                    xui.tryF(onEnd, [threadid]);
                    onEnd = null;
                    xui.Thread.resume(threadid);
                }, null, options, isAsy);
            } else
                xui.tryF(onEnd, [threadid]);
        }
    }
});

//xui.absBox
xui.Class('xui.absBox', null, {
    Constructor: function () {
        var upper = arguments.callee.upper;
        if (upper) upper.call(this);
        upper = null;
        this._nodes = [];
        this.Class = this.constructor;
    },
    Before: function (key) {
        var t = xui.absBox;
        if (t) (t = t.$type)[key.replace('xui.', '')] = t[key] = key;
    },
    Instance: {
        __gc: function () {
            this.each(function (profile) {
                xui.tryF(profile.__gc);
            });
            this._nodes = 0;
        },
        _get: function (index) {
            var t = this._nodes;
            return xui.isNumb(index) ? t[index] : t;
        },
        _empty: function () {
            this._nodes.length = 0;
            return this;
        },
        getProfile: function (all) {
            return all ? this._nodes : this._nodes[0];
        },
        get: function (index) {
            return this._get(index);
        },
        size: function () {
            return this._nodes.length;
        },
        _each: function (fun, scope, desc) {
            var self = this, j = self._nodes, l = j.length, i, n;
            if (desc) {
                for (i = l; i >= 0; i--)
                    if (n = j[i])
                        if (false === fun.call(scope || self, n, i))
                            break;
            } else {
                for (i = 0; i < l; i++)
                    if (n = j[i])
                        if (false === fun.call(scope || self, n, i))
                            break;
            }
            n = null;
            return self;
        },
        each: function (fun, scope, desc) {
            return this._each(fun, scope, desc);
        },
        isEmpty: function () {
            return !this._nodes.length;
        },
        merge: function (obj) {
            if (this == xui.win || this == xui.doc || this == xui('body') || this == xui('html')) return this;
            var self = this, c = self.constructor, obj = obj._nodes, i = 0, t, n = self._nodes;
            if (obj.length) {
                for (; t = obj[i++];) n[n.length] = t;
                self._nodes = c._unique(n);
            }
            return self;
        },
        reBoxing: function (key, ensureValue) {
            var self = this, t = xui.absBox.$type[key || 'Dom'];
            if (!t) return xui.UI.pack([]);
            if (t == self.KEY) return self;
            if (t = xui.SC(t)) return t.pack(self._nodes, ensureValue);
        }
    },
    Static: {
        $abstract: true,
        $type: {},
        pack: function (arr, ensureValue) {
            var o = new this(false);

            o._nodes = !arr
                ? []
                : ensureValue === false
                    ? xui.isArr(arr)
                        ? arr
                        : [arr]
                    : typeof this._ensureValues == 'function'
                        ? this._ensureValues(arr)
                        : xui.isArr(arr)
                            ? arr
                            : [arr];
            o.n0 = o._nodes[0];
            return o;
        },
        _unique: function (arr) {
            var h = {}, a = [], i = 0, l = arr.length, t, k;
            for (; i < l; i++) a[i] = arr[i];
            arr.length = 0;
            i = 0;
            for (; t = a[i++];) {
                k = typeof t == 'string' ? t : t.$xid;
                if (!h[k]) {
                    h[k] = 1;
                    arr.push(t);
                }
            }
            return arr;
        },
        plugIn: function (name, fun) {
            this.prototype[name] = fun;
            return this;
        }
    }
});

xui.Class('xui.absProfile', null, {
    Constructor: function () {
        var upper = arguments.callee.upper;
        if (upper) upper.call(this);
        upper = null;
        if (!this.$xid) this.$xid = xui.absProfile.$xid.next();
    },
    Instance: {
        getId: function () {
            return this.$xid;
        },
        getUid: function (ext) {
            return this.key + ":" + this.$xid + (ext ? (":" + ext) : "");
        },
        link: function (obj, id, target, index) {
            return xui.absProfile.prototype.$link(this, obj, id, target, index);
        },
        $link: function (self, obj, id, target, index) {
            var uid = '$' + self.$xid;

            target = target || self;
            if (obj[uid]) self.unLink(id);

            //double link
            obj[uid] = target;
            if (xui.isArr(obj))
                xui.arr.insertAny(obj, target, index, true);

            //antilink track
            self._links[id] = obj;
            return self;
        },
        unLink: function (id) {
            return xui.absProfile.prototype.$unLink(this, id);
        },
        $unLink: function (self, id) {
            var o, index,
                //avoid Number;
                uid = '$' + self.$xid;
            if (!self._links) return;
            if (!(o = self._links[id])) return;

            //remove from target
            if (xui.isArr(o)) {
                index = xui.arr.indexOf(o, o[uid]);
                if (index != -1) {
                    xui.arr.removeFrom(o, index);
                }
            }
            delete o[uid];

            //remove from self
            delete self._links[id];

            return index;
        },
        unLinkAll: function () {
            return xui.absProfile.prototype.$unLinkAll(this);
        },
        $unLinkAll: function (self) {
            var id = '$' + self.$xid,
                l = self._links,
                o, i;
            for (i in l) {
                o = l[i];
                if (xui.isArr(o)) xui.arr.removeValue(o, o[id]);
                delete o[id];
            }
            self._links = {};
            return self;
        },
        getModule: function (top) {
            var prf = this, getUpperModule = function (module) {
                // if it's a inner module
                if (module.moduleClass && module.moduleXid) {
                    var pm = xui.SC.get(module.moduleClass);
                    if (pm && (pm = pm.getInstance(module.moduleXid))) {
                        return getUpperModule(pm);
                    }
                }
                return module;
            }, t;

            if (prf.moduleClass && prf.moduleXid) {
                if (t = xui.SC.get(prf.moduleClass)) {
                    if (t = t.getInstance(prf.moduleXid)) {
                        return top ? getUpperModule(t) : t;
                    }
                }
            }
        },
        getParent: function () {
            return this.parent && this.parent.boxing();
        },
        getChildrenId: function () {
            return this.childrenId;
        }
    },
    Static: {
        $xid: new xui.id,
        $abstract: true
    }
});

xui.Class('xui.Profile', 'xui.absProfile', {
    Constructor: function (host, key, alias, box, properties, events, options) {
        var upper = arguments.callee.upper, args = xui.toArr(arguments);
        upper.apply(this, args);
        upper = null;
        var self = this;
        xui.merge(self, options);

        self.key = key || self.key || '';
        self.alias = alias || self.alias || '',
            self.properties = properties ? xui.copy(properties) : (self.properties || {});
        self.events = events ? xui.copy(events) : (self.events || {});
        self.host = host || self.host || self;
        self.Class = self.constructor;
        self.box = box || self.box;
        if (self.events) {
            self.setEvents(self.events);
            delete self.events;
        }
        self._links = {};
    },
    Instance: {
        setEvents: function (key, value) {
            var evs = this.box.$EventHandlers;
            if (xui.isHash(key)) {
                return xui.merge(this, key, 'all', function (o, i) {
                    return evs[i]
                });
            } else {
                if (evs[key])
                    this[key] = value;
            }
        },
        getEvents: function (key) {
            if (key) {
                return this[key];
            } else {
                var self = this, t, hash = {};
                xui.each(self.box.$EventHandlers, function (o, i) {
                    if (self[i]) hash[i] = self[i];
                });
                return hash;
            }
        },
        getProperties: function (key) {
            var self = this, prop = self.properties;
            if (xui.isFun(self._propGetter)) prop = self._propGetter(prop);
            if (xui.isFun(self.propGetter)) prop = self.propGetter(prop);
            return key ? prop[key] : xui.copy(prop);
        },
        setProperties: function (key, value) {
            var self = this;
            if (xui.isHash(key)) {
                xui.merge(key, self.box.$DataStruct, function (o, i) {
                    if (!(i in key)) {
                        key[i] = xui.isObj(o) ? xui.clone(o) : o;
                    }
                });
                self.properties = key;
                if (xui.isFun(self._propSetAction)) self._propSetAction(key);
                if (xui.isFun(self.propSetAction)) self.propSetAction(key);
            } else
                self.properties[key] = value;
        },
        _applySetAction: function (fun, value, ovalue, force, tag, tag2) {
            return fun.call(this, value, ovalue, force, tag, tag2);
        },
        __gc: function () {
            var ns = this, args = xui.toArr(arguments);
            if (ns.$beforeDestroy) {
                xui.each(ns.$beforeDestroy, function (f) {
                    xui.tryF(f, args, ns);
                });
                delete ns.$beforeDestroy;
            }
            xui.tryF(ns.$ondestory, args, ns);
            if (ns.onDestroy) ns.boxing().onDestroy();
            if (ns.destroyTrigger) ns.destroyTrigger();

            // try to clear parent host
            var o;
            if (ns.alias && ns.host && (o = ns.host[ns.alias]) && (o = o._nodes) && (o.length === 0 || o.length === 1 && o[0] == ns)) {
                delete ns.host[ns.alias];
            }

            ns.unLinkAll();
            xui.tryF(ns.clearCache, [], ns);

            //set once
            ns.destroyed = true;
            //afterDestroy
            if (ns.$afterDestroy) {
                xui.each(ns.$afterDestroy, function (f) {
                    xui.tryF(f, args, ns);
                });
                delete ns.$afterDestroy;
            }
            if (ns.afterDestroy) ns.boxing().afterDestroy(ns);
            xui.breakO([ns.properties, ns.events, ns], 2);
            //set again
            ns.destroyed = true;
        },
        boxing: function () {
            //cache boxing
            var self = this, t;
            //for destroyed UIProfile
            if (!self.box) return null;
            if (!((t = self.Instace) && t.get(0) == self && t._nodes.length == 1))
                t = self.Instace = self.box.pack([self], false);
            return t;
        },
        serialize: function (rtnString, keepHost) {
            var t,
                self = this,
                o = (t = self.box._beforeSerialized) ? t(self) : self,
                r = {
                    alias: o.alias,
                    key: o.key,
                    host: o.host
                };
            //host
            if (r.host === self) {
                delete r.host;
            } else if (o.host && !keepHost) {
                if (rtnString !== false)
                    r.host = '@this';
                else
                    delete r.host;
            }

            //properties
            var c = {}, p = o.box.$DataStruct, map = xui.absObj.$specialChars;
            xui.merge(c, o.properties, function (o, i) {
                return (i in p) && p[i] !== o && !map[i.charAt(0)]
            });
            if (!xui.isEmpty(c)) r.properties = c;

            //events
            if (!xui.isEmpty(t = this.getEvents())) r.events = t;
            var eh = o.box.$EventHandlers;
            xui.filter(r.events, function (o, i) {
                return o != eh[i];
            });
            if (xui.isEmpty(r.events)) delete r.events;
            return rtnString === false ? r : xui.serialize(r);
        }
    }
});

xui.Class('xui.absObj', "xui.absBox", {
    //properties, events, host
    Constructor: function () {
        var upper = arguments.callee.upper, args = xui.toArr(arguments);
        upper.apply(this, args);
        upper = null;
        //for pack function
        if (args[0] !== false && typeof this._ini == 'function')
            return this._ini.apply(this, args);
    },
    Before: function (key, parent_key, o) {
        xui.absBox.$type[key] = key;
        return true;
    },
    After: function () {
        var self = this, me = arguments.callee,
            temp, t, k, u, m, i, j, l, v, n, b;
        self._nameId = 0;
        self._nameTag = self.$nameTag || (self.KEY.replace(/\./g, '_').toLowerCase());
        self._cache = [];
        m = me.a1 || (me.a1 = xui.toArr('$Keys,$DataStruct,$EventHandlers,$DataModel'));
        for (j = 0; v = m[j++];) {
            k = {};
            if ((t = self.$parent) && (i = t.length))
                while (i--)
                    xui.merge(k, t[i][v]);
            self[v] = k;
        }

        self.setDataModel(self.DataModel);
        delete self.DataModel;

        self.setEventHandlers(self.EventHandlers);
        delete self.EventHandlers;

        m = me.a5 || (me.a5 = xui.toArr('RenderTrigger,LayoutTrigger'));
        for (j = 0; v = m[j++];) {
            temp = [];
            if ((t = self.$parent) && (l = t.length))
                for (i = 0; i < l; i++) {
                    u = t[i]
                    if (u = u['$' + v])
                        temp.push.apply(temp, u);
                }
            if (self[v])
                temp.push(self[v]);

            // sort sub node
            xui.arr.stableSort(temp, function (x, y) {
                x = x.$order || 0;
                y = y.$order || 0;
                return x > y ? 1 : x == y ? 0 : -1;
            });

            self['$' + v] = temp;
            delete self[v];
        }
    },
    //don't add any other function or member to absObj
    Static: {
        $abstract: true,
        $specialChars: {_: 1, $: 1},

        // *** non-abstract child must have this
        //_objectProp:{tagVar:1,propBinder:1},
        DataModel: {
            "name": '',
            desc: '',
            tag: '',
            tagVar: {
                ini: {},
                action: function () {
                    var r = this.properties.renderer;
                    if (r && /^\s*[a-zA-Z]+([\w]+\.?)+[\w]+\s*$/.test(r))
                        this.boxing().refresh();
                }
            },
            propBinder: {
                hidden: 1,
                ini: {}
            },
            dataBinder: {
                ini: '',
                set: function (value) {
                    var profile = this,
                        p = profile.properties,
                        ovalue = p.dataBinder;
                    if (ovalue)
                        xui.DataBinder._unBind(ovalue, profile);
                    p.dataBinder = value;
                    xui.DataBinder._bind(value, profile);
                }
            },
            dataField: {
                ini: ''
            }
        },
        get: function (index) {
            return this.pack([this._cache[index || 0]]);
        },
        getAll: function () {
            return this.pack(this._cache);
        },
        pickAlias: function () {
            return xui.absObj.$pickAlias(this);
        },
        $pickAlias: function (cls) {
            var a = cls._nameTag, p = cls._cache, t;
            while (t = (a + (++cls._nameId))) {
                for (var i = 0, l = p.length; i < l; i++) {
                    if (p[i].alias === t) {
                        t = -1;
                        break;
                    }
                }
                if (t == -1) continue;
                else return t;
            }
        },
        setDataModel: function (hash) {
            var self = this,
                sc = xui.absObj.$specialChars,
                ds = self.$DataStruct,
                dm = self.$DataModel,
                ps = self.prototype,
                i, j, t, o, n, m, r;

            //merge default value and properties
            for (i in hash) {
                if (!dm[i]) dm[i] = {};
                o = hash[i];
                if (null === o || undefined === o) {
                    r = xui.str.initial(i);
                    delete ds[i];
                    delete dm[i]
                    if (ps[j = 'get' + r] && ps[j].$auto$) delete ps[j];
                    if (ps[j = 'set' + r] && ps[j].$auto$) delete ps[j];
                    //Here, if $DataModel inherites from it's parent class, properties[i] will pointer to parent's object.
                } else {
                    t = typeof o;
                    if (t != 'object' || o.constructor != Object)
                        o = {ini: o};
                    ds[i] = ('ini' in o) ? o.ini : (i in ds) ? ds[i] : '';

                    t = dm[i];
                    for (j in t)
                        if (!(j in o))
                            o[j] = t[j];
                    dm[i] = o;
                }
            }

            xui.each(hash, function (o, i) {
                if (null === o || undefined === o || sc[i.charAt(0)]) return;
                r = xui.str.initial(i);
                n = 'set' + r;
                //readonly properties
                if (o.set !== null && !(o && (o.readonly || o.inner))) {
                    //custom set
                    var $set = o.set;
                    m = ps[n];
                    ps[n] = (typeof $set != 'function' && typeof m == 'function') ? m : xui.Class._fun(function (value, force, tag, tag2) {
                        return this.each(function (v) {
                            if (!v.properties) return;

                            var t, nfz;
                            // *** force to em/px
                            if (!force) {
                                if (dm[i] && dm[i]['$spaceunit']) {
                                    if (v.$forceu && value != 'auto') {
                                        t = xui.$us(v);
                                        value = v.$forceu(value, t == 2 ? 'em' : t == -2 ? 'px' : null);
                                    }
                                }
                            }
                            //if same return
                            if (v.properties[i] === value && !force) return;

                            if (v.$beforePropSet && false === v.$beforePropSet(i, value, force, tag, tag2)) {
                                return;
                            } else {
                                var ovalue = v.properties[i];
                                if (v.beforePropertyChanged && false === v.boxing().beforePropertyChanged(v, i, value, ovalue))
                                    return;

                                if (typeof $set == 'function') {
                                    $set.call(v, value, force, tag, tag2);
                                } else {
                                    var m = xui.get(v.box.$DataModel, [i, 'action']);
                                    v.properties[i] = value;
                                    if (typeof m == 'function' && v._applySetAction(m, value, ovalue, force, tag, tag2) === false)
                                        v.properties[i] = ovalue;
                                }

                                if (v.afterPropertyChanged) v.boxing().afterPropertyChanged(v, i, value, ovalue);
                                if (v.$afterPropertyChanged) xui.tryF(v.$afterPropertyChanged, [v, i, value, ovalue], v);
                            }
                        });
                    }, n, self.KEY, null, 'instance');
                    //delete o.set;
                    if (ps[n] !== m) ps[n].$auto$ = 1;
                } else
                    delete ps[n];
                n = 'get' + r;
                if (!(o && o.inner)) {
                    // get custom getter
                    var $get = o.get;
                    m = ps[n];
                    ps[n] = (typeof $get != 'function' && typeof m == 'function') ? m : xui.Class._fun(function () {
                        if (typeof $get == 'function')
                            return $get.apply(this.get(0), arguments);
                        else
                            return this.get(0).properties[i];
                    }, n, self.KEY, null, 'instance');
                    //delete o.get;
                    if (ps[n] !== m) ps[n].$auto$ = 1;
                } else
                    delete ps[n];
            });
            return self;
        },
        setEventHandlers: function (hash) {
            var self = this;
            xui.each(hash, function (o, i) {
                if (null === o) {
                    delete self.$EventHandlers[i];
                    delete self.prototype[i];
                } else {
                    self.$EventHandlers[i] = o;
                    var f = function (fun) {
                        var l = arguments.length, j;
                        if (l == 1 && (typeof fun == 'function' || typeof fun == 'string' || xui.isHash(fun) || xui.isArr(fun)))
                            return this.each(function (v) {
                                if (v.renderId)
                                    v.clearCache();
                                if (v.box._addEventHanlder) v.box._addEventHanlder(v, i, fun);
                                v[i] = fun;
                            });
                        else if (l == 1 && null === fun)
                            return this.each(function (v) {
                                v.clearCache();
                                if (v.box._removeEventHanlder) v.box._removeEventHanlder(v, i, v[i]);
                                delete v[i];
                            });
                        else {
                            var args = [], prf = this.get(0);
                            if (prf) {
                                var events = prf[i], host = prf.host || prf;
                                if (events && (!xui.isArr(events) || events.length)) {
                                    if (prf.$inDesign) return;
                                    prf.$lastEvent = i;
                                    if (arguments[0] != prf) args[0] = prf;
                                    for (j = 0; j < l; j++) args[args.length] = arguments[j];
                                    if (xui.isStr(events) || xui.isFun(events)) events = [events];
                                    if (xui.isArr(events.actions || events) && (events.actions && xui.isArr(events.actions) && events.actions.length > 0) && xui.isNumb(j = (events.actions || events)[0].event)) args[j] = args[j] ? xui.Event.getEventPara(args[j]) : {};

                                    return xui.pseudocode._callFunctions(events, args, host, null, prf.$holder, ((host && host.alias) || (prf.$holder && prf.$holder.alias)) + "." + prf.alias + "." + i);
                                }
                            }
                        }
                    };
                    f.$event$ = 1;
                    f.$original$ = o.$original$ || self.KEY;
                    f.$name$ = i;
                    f.$type$ = 'event';
                    self.plugIn(i, f);
                }
            });
            return self;
        },
        unserialize: function (target, keepSerialId) {
            if (typeof target == 'string') target = xui.unserialize(target);
            var f = function (o) {
                if (xui.isArr(o)) o = o[0];
                delete o.serialId;
                if (o.children) xui.arr.each(o.children, f);
            }, a = [];
            xui.arr.each(target, function (o) {
                if (!keepSerialId) f(o);
                a.push((new (xui.SC(o.key))(o)).get(0));
            });
            return this.pack(a, false);
        }
    },
    Instance: {
        clone: function () {
            var arr = [], clrItems = arguments, f = function (p) {
                //remove those
                delete p.alias;
                for (var i = 0; i < clrItems.length; i++)
                    delete p[clrItems[i]];
                if (p.children)
                    for (var i = 0, c; c = p.children[i]; i++)
                        f(c[0]);
            };
            this.each(function (o) {
                o = o.serialize(false, true);
                f(o);
                arr.push(o);
            });
            return this.constructor.unserialize(arr);
        },
        serialize: function (rtnString, keepHost) {
            var a = [];
            this.each(function (o) {
                a[a.length] = o.serialize(false, keepHost);
            });
            return rtnString === false ? a : a.length == 1 ? " new " + a[0].key + "(" + xui.serialize(a[0]) + ")" : "xui.UI.unserialize(" + xui.serialize(a) + ")";
        },
        getProperties: function (key) {
            var h = {}, prf = this.get(0), prop = prf.properties, funName;
            if (key === true)
                return xui.copy(prop);
            else if (typeof key == 'string')
                return prop[key];
            else {
                for (var k in prop) {
                    funName = "get" + xui.str.initial(k);
                    if (typeof this[funName] == 'function')
                        h[k] = this[funName].call(this);
                }
                return h;
            }
        },
        setProperties: function (key, value, force) {
            if (typeof key == "string") {
                var h = {};
                h[key] = value;
                key = h;
            }
            return this.each(function (o) {
                xui.each(key, function (v, k) {
                    var funName = "set" + xui.str.initial(k), ins = o.boxing();
                    if (ins && typeof ins[funName] == 'function') {
                        ins[funName].call(ins, v, !!force);
                    }
                    // can set hidden prop here
                    else {
                        o.properties[k] = v;
                    }
                });
            });
        },
        getEvents: function (key) {
            return this.get(0).getEvents(key);
        },
        setEvents: function (key, value) {
            if (typeof key == "string") {
                var h = {};
                h[key] = value;
                key = h;
            }
            return this.each(function (o) {
                var ins = o.boxing();
                xui.each(key, function (v, k) {
                    if (typeof ins[k] == 'function')
                        ins[k].call(ins, v);
                });
            });
        },
        alias: function (value) {
            return value ? this.setAlias(value) : this.getAlias();
        },
        host: function (value, alias) {
            return value ? this.setHost(value, alias) : this.getHost();
        },
        setHost: function (host, alias) {
            return this._setHostAlias(host, alias);
        },
        _setHostAlias: function (host, alias) {
            var self = this,
                prf = this.get(0),
                oldAlias = prf.alias;

            alias = alias || prf.alias;

            if (oldAlias) {
                if (prf.host && prf.host !== prf) {
                    try {
                        delete prf.host[oldAlias]
                    } catch (e) {
                        prf.host[oldAlias] = undefined
                    }
                    if (prf.host._ctrlpool)
                        delete prf.host._ctrlpool[oldAlias];
                }
            }
            prf.alias = alias;
            if (prf.box && prf.box._syncAlias) {
                prf.box._syncAlias(prf, oldAlias, alias);
            }

            if (host) prf.host = host;
            if (prf.host && prf.host !== prf) {
                prf.host[alias] = self;
                if (prf.host._ctrlpool)
                    prf.host._ctrlpool[alias] = self.get(0);
            }
            return self;
        },
        setAlias: function (alias) {
            return this._setHostAlias(null, alias);
        },
        getAlias: function () {
            return this.get(0).alias;
        },
        getHost: function () {
            return this.get(0).host;
        },
        reBindProp: function (dataMap, scope_set, scope_clear, _scope_handled) {
            if (!_scope_handled) {
                scope_set = scope_set || xui._scope_set;
                scope_clear = scope_clear || xui._scope_clear;
            }

            var ns = this, prop, ins, fn, r;
            try {
                if (!_scope_handled) scope_set.call(this, dataMap);
                ns.each(function (prf) {
                    prop = prf.properties;
                    if (prop.propBinder && !xui.isEmpty(prop.propBinder)) {
                        ins = prf.boxing();
                        xui.each(prop.propBinder, function (get_prop_value, key) {
                            if (xui.isDefined(r = xui.isFun(get_prop_value) ? get_prop_value(prf) : xui.adjustVar(get_prop_value))) {
                                if (false !== xui.tryF(ins._reBindProp, [prf, r, key, get_prop_value], ins)) {
                                    switch (key) {
                                        case "CA":
                                            ins.setCustomAttr(r);
                                            break;
                                        case "CC":
                                            ins.setCustomClass(r);
                                            break;
                                        case "CS":
                                            ins.setCustomStyle(r);
                                            break;
                                        default:
                                            if (xui.isFun(ins[fn = 'set' + xui.str.initial(key)])) ins[fn](r, true);
                                    }
                                }
                            }
                        });
                    }
                });
            } catch (e) {
                if (!_scope_handled) scope_clear.call(this);
            }


            return this;
        }
        /*non-abstract inheritance must have those functions:*/
        //1. destroy:function(){this.get(0).__gc();}
        //2. _ini(properties, events, host, .....){/*set _nodes with profile*/return this;}
        //3. render(){return this}
    }
});

xui.Class("xui.Timer", "xui.absObj", {
    Instance: {
        _ini: function (properties, events, host) {
            var self = this,
                c = self.constructor,
                profile,
                options,
                alias, temp;
            if (properties && properties['xui.Profile']) {
                profile = properties;
                alias = profile.alias || c.pickAlias();
            } else {
                if (properties && properties.key && xui.absBox.$type[properties.key]) {
                    options = properties;
                    properties = null;
                    alias = options.alias || c.pickAlias();
                } else
                    alias = c.pickAlias();
                profile = new xui.Profile(host, self.$key, alias, c, properties, events, options);
            }
            profile._n = profile._n || [];

            for (var i in (temp = c.$DataStruct))
                if (!(i in profile.properties))
                    profile.properties[i] = typeof temp[i] == 'object' ? xui.copy(temp[i]) : temp[i];

            //set anti-links
            profile.link(c._cache, 'self').link(xui._pool, 'xui');

            self._nodes.push(profile);
            profile.Instace = self;
            self.n0 = profile;

            if (self._after_ini) self._after_ini(profile, alias);
            return self;
        },
        _after_ini: function (profile) {
            if (profile.$inDesign) return;
            xui.asyRun(function () {
                if (profile && profile.box && profile.properties.autoStart) profile.boxing().start();
            });
        },
        destroy: function () {
            this.each(function (profile) {
                if (profile._threadid) xui.Thread.abort(profile._threadid);
                //free profile
                profile.__gc();
            });
        },
        start: function () {
            return this.each(function (profile) {
                if (profile.$inDesign) return;
                if (profile._threadid) {
                    xui.Thread.resume(profile._threadid);
                } else {
                    var p = profile.properties, box = profile.boxing(),
                        t = xui.Thread.repeat(function (threadId) {
                            if (profile.$onTime && false === profile.$onTime(profile, threadId)) return false;
                            if (profile.onTime && false === box.onTime(profile, threadId)) return false;
                        }, p.interval, function (threadId) {
                            profile.onStart && box.onStart(profile, threadId);
                        }, function (threadId) {
                            profile.onEnd && box.onEnd(profile, threadId);
                        });
                    profile._threadid = t.id;
                }
            });
        },
        suspend: function () {
            return this.each(function (profile) {
                if (profile._threadid) xui.Thread.suspend(profile._threadid);
                profile.onSuspend && box.onSuspend(profile, threadId);
            });
        },
        getParent: function () {
            return this.parent && this.parent.boxing();
        },
        getChildrenId: function () {
            return this.childrenId;
        }
    },
    Static: {
        _objectProp: {tagVar: 1, propBinder: 1},
        _beforeSerialized: function (profile) {
            var o = {};
            xui.merge(o, profile, 'all');
            var p = o.properties = xui.clone(profile.properties, true);
            if (profile.box._objectProp) {
                for (var i in profile.box._objectProp)
                    if ((i in p) && p[i] && xui.isHash(p[i]) && xui.isEmpty(p[i])) delete p[i];
            }
            return o;
        },
        DataModel: {
            autoStart: true,
            "interval": 1000
        },
        EventHandlers: {
            // return false will stop the Timer
            onTime: function (profile, threadId) {
            },
            onStart: function (profile, threadId) {
            },
            onSuspend: function (profile, threadId) {
            },
            onEnd: function (profile, threadId) {
            }
        }
    }
});

xui.Class("xui.MessageService", "xui.absObj", {
    Instance: {
        _ini: xui.Timer.prototype._ini,
        _after_ini: function (profile) {
            if (profile.$inDesign) return;
            var t, p = profile.properties;
            if (t = p.recipientType || p.msgType) profile.boxing().setRecipientType(t, true);
        },
        destroy: function () {
            this.each(function (profile) {
                if (profile.$inDesign) return;
                //** unsubscribe
                var t, id = profile.$xid;
                if (t = profile.properties.msgType) {
                    xui.arr.each(t.split(/[\s,;:]+/), function (t) {
                        xui.unsubscribe(t, id);
                    });
                }
                //free profile
                profile.__gc();
            });
        },
        broadcast: function (recipientType, msg1, msg2, msg3, msg4, msg5, readReceipt) {
            return this.each(function (profile) {
                var ins = profile.boxing();
                xui.arr.each(recipientType.split(/[\s,;:]+/), function (t) {
                    xui.publish(t, [msg1, msg2, msg3, msg4, msg5, function () {
                        xui.tryF(readReceipt);
                        if (profile.onReceipt) ins.onReceipt.apply(ins, [profile, t, xui.toArr(arguments)]);
                    }], null, ins);
                });
            });
        },
        getParent: xui.Timer.prototype.getParent,
        getChildrenId: xui.Timer.prototype.getChildrenId
    },
    Static: {
        _objectProp: xui.Timer._objectProp,
        _beforeSerialized: xui.Timer._beforeSerialized,
        DataModel: {
            dataBinder: null,
            dataField: null,
//兼容旧版本
            msgType: {
                ini: "",
                set: function (value) {
                    var profile = this, t, p = profile.properties, id = profile.$xid;
                    if (t = p.msgType) {
                        xui.arr.each(t.split(/[\s,;:]+/), function (t) {
                            xui.unsubscribe(t, id);
                        });
                    }
                    if (t = p.msgType = value || "") {
                        xui.arr.each(t.split(/[\s,;:]+/), function (t) {
                            xui.subscribe(t, id, function () {
                                var a = xui.toArr(arguments), ins = profile.boxing();
                                a.unshift(profile);
                                if (profile.onMessageReceived) ins.onMessageReceived.apply(ins, a);
                            }, p.asynReceive);
                        });
                    }
                }
            },


            recipientType: {
                ini: "",
                set: function (value) {
                    var profile = this, t, p = profile.properties, id = profile.$xid;
                    if (t = p.recipientType) {
                        xui.arr.each(t.split(/[\s,;:]+/), function (t) {
                            xui.unsubscribe(t, id);
                        });
                    }
                    if (t = p.recipientType = value || "") {
                        xui.arr.each(t.split(/[\s,;:]+/), function (t) {
                            xui.subscribe(t, id, function () {
                                var a = xui.toArr(arguments), ins = profile.boxing();
                                a.unshift(profile);
                                if (profile.onMessageReceived) ins.onMessageReceived.apply(ins, a);
                            }, p.asynReceive);
                        });
                    }
                }
            },
            asynReceive: false
        },
        EventHandlers: {
            onMessageReceived: function (profile, msg1, msg2, msg3, msg4, msg5, readReceipt) {
            },
            onReceipt: function (profile, recipientType, args) {
            }
        }
    }
});

/*** xui.ExcelFormula.calculate
 * formula :
 *      "=FIXED(SUM(1:1, AVERAGE(A:A, B3)) + ROUND(B5)*C6 + MAX(A1:B2, B3) + MIN(10, B3)/ 1000, 2)"
 *      "=FIXED(SUM(1, AVERAGE(1, 3)) + ROUND(3.3)*1 + MAX(4, 2) + MIN(10, 5)/ 3, 2)" => 11.67
 *      "=CHOOSE(2,'a','b','c')" => 'b'
 * cellsMap :
 *      true: force to return something without cell value maps
 *      {}: returns the result of the formula with cell value maps
 ***/
xui.Class("xui.ExcelFormula", null, {
    Static: {
        MAXCOUNT: 256,
        // support functions: +,-,*,/,%,SUM, AVERAGE, MIN, MAX, ROUND, FIXED, CHOOSE
        Supported: (function () {
            var flatten = function (args) {
                var arr = [], t, args = xui.toArr(args), i = 0, l = args.length;
                for (; i < l; i++) {
                    if (xui.isArr(t = args[i])) arr = arr.concat(t);
                    else arr.push(t);
                }
                return arr;
            };
            return {
                SUM: function () {
                    var result = 0, arr = flatten(arguments), i = 0, l = arr.length, v, parsed;
                    for (; i < l; ++i) {
                        v = arr[i];
                        if (typeof v === 'number') {
                            result += v;
                        } else if (typeof v === 'string') {
                            parsed = parseFloat(v);
                            if (!xui.isNaN(parsed))
                                result += parsed;
                        }
                    }
                    return result;
                },
                AVERAGE: function () {
                    var result = 0, arr = flatten(arguments), i = 0, l = arr.length, v, parsed;
                    for (; i < l; ++i) {
                        v = arr[i];
                        if (typeof v === 'number') {
                            result += v;
                        } else if (typeof v === 'string') {
                            parsed = parseFloat(v);
                            if (!xui.isNaN(parsed))
                                result += parsed;
                        }
                    }
                    return result / l;
                },
                COUNT: function () {
                    var result = 0, arr = flatten(arguments), i = 0, l = arr.length, v;
                    for (; i < l; ++i) {
                        v = typeof(arr[i]);
                        if (v === 'string' || v === 'number') result++;
                    }
                    return result;
                },
                MIN: function () {
                    return Math.min.apply(Math, flatten(arguments));
                },
                MAX: function () {
                    return Math.max.apply(Math, flatten(arguments));
                },
                ROUND: function () {
                    return Math.round.apply(Math, arguments);
                },
                FIXED: function () {
                    return xui.toFixedNumber.apply(xui, arguments);
                },
                CHOOSE: function () {
                    var a = arguments;
                    return (xui.isNumb(a[0]) && (a[a[0]])) || '';
                },
                CONCATENATE: function () {
                    return flatten(arguments).join('')
                },
                ABS: function (a) {
                    return Math.abs(a)
                },
                ISNUMBER: function (v) {
                    return xui.isFinite(v)
                },
                NOW: function () {
                    return new Date
                },
                TODAY: function () {
                    return xui.Date.getTimSpanStart(new Date, 'DAY')
                },
                IF: function (a, b, c) {
                    return eval(a) ? b : c
                },
                AND: function () {
                    return !!eval(xui.toArr(arguments).join("&&"))
                },
                OR: function () {
                    return !!eval(xui.toArr(arguments).join("||"))
                },
                NOT: function (a) {
                    return !a
                }
            };
        })(),
        toColumnChr: function (num) {
            var s = "";
            num = num - 1;
            while (num >= 0) {
                s = String.fromCharCode(num % 26 + 97) + s;
                num = Math.floor(num / 26) - 1;
            }
            return s.toUpperCase();
        },
        toColumnNum: function (chr) {
            chr = chr.split('');
            var base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(''),
                i = 0, j = chr.length - 1, result = 0;

            for (; i < chr.length; i += 1, j -= 1) {
                result += Math.pow(base.length, j) * (base.indexOf(chr[i]) + 1);
            }
            return result;
        },
        toCoordinate: function (cell, offset, rtnArr) {
            var alpha = /[A-Z]+/,
                num = /[0-9]+/,
                cellU = cell.toUpperCase(), row, col;
            if (!offset && offset !== 0) offset = -1;
            row = parseInt(cellU.match(num)[0], 10) + offset;
            col = this.toColumnNum(cellU.match(alpha)[0]) + offset;
            return rtnArr ? [row, col] : {col: col, row: row};
        },
        toCellId: function (col, row, offset) {
            return this.toColumnChr(col + (offset || 1)) + (row + (offset || 1));
        },
        getCellRanges: function (cellFrom, cellEnd, colLimited, rowLimited) {
            var ns = this,
                alpha = /[A-Z]+/,
                num = /[0-9]+/;

            if (!alpha.test(cellFrom)) cellFrom = "A" + cellFrom;
            if (!num.test(cellFrom)) cellFrom = cellFrom + "1";
            if (!alpha.test(cellEnd)) cellEnd = ns.toColumnChr(colLimited || ns.MAXCOUNT) + cellEnd;
            if (!num.test(cellEnd)) cellEnd = cellEnd + (rowLimited || ns.MAXCOUNT);

            var cellStart = ns.toCoordinate(cellFrom, 0),
                cellStop = ns.toCoordinate(cellEnd, 0),
                colStart = cellStart.col,
                colStop = cellStop.col,
                rowStart = cellStart.row,
                rowStop = cellStop.row,
                cellRange = [],
                row,
                col;

            if (colStart < colStop) {
                for (col = colStart; col <= colStop; col++) {
                    if (rowStart < rowStop) {
                        for (row = rowStart; row <= rowStop; row++) {
                            cellRange.push(ns.toColumnChr(col) + row);
                        }
                    } else {
                        for (row = rowStart; row >= rowStop; row--) {
                            cellRange.push(ns.toColumnChr(col) + row);
                        }
                    }
                }
            } else {
                for (col = colStart; col >= colStop; col--) {
                    if (rowStart < rowStop) {
                        for (row = rowStart; row <= rowStop; row++) {
                            cellRange.push(ns.toColumnChr(col) + row);
                        }
                    } else {
                        for (row = rowStart; row >= rowStop; row--) {
                            cellRange.push(ns.toColumnChr(col) + row);
                        }
                    }
                }
            }
            return cellRange;
        },
        validate: function (formula) {
            var str;
            if (xui.isFun(formula)) str = formula + '';
            else {
                if (!/^\s*\=\s*/.test(formula))
                    return false;
                str = formula.replace(/^\s*\=\s*/, '');
            }
            // for col/row fomula in the grid
            str = str.replace(/(\b)([\?_])([0-9]+\b)/g, '1').replace(/(\b[A-Z]+)([\?_])(\b)/g, '1');

            if (/function\s*\(/.test(str)) {
                try {
                    str = xui.fun.body(str);
                    new Function("", str);
                } catch (e) {
                    xui._debugInfo("throw", "#VALUE! ", formula, str, e);
                    return false;
                }
            } else {
                var fake = function () {
                        return 1;
                    },
                    reg = new RegExp(xui.toArr(this.Supported, true).join('|'), 'g');
                str = xui.replace(str, [
                    // protect "" and ''
                    [/"(\\.|[^"\\])*"/, '1'],
                    [/'(\\.|[^'\\])*'/, '1'],
                    // replace cells
                    [/\{[^}]+\}/, '1'],
                    [/([A-Z\d]+\s*\:\s*[A-Z\d]+)/, '1'],
                    [/([A-Z]+[\d]+)/, '1'],
                    // replace expressions
                    [/[=<>]+/g, function (a) {
                        return a[0] == '=' ? '==' : a[0] == '<>' ? '!=' : a[0]
                    }]
                ]);
                if (/[A-Z_$]/.test(str.replace(reg, '')))
                    return false;
                str = str.replace(reg, 'fake');
                try {
                    eval(str);
                } catch (e) {
                    xui._debugInfo("throw", "#VALUE! ", formula, str, e);
                    return false;
                }
            }
            return true;
        },
        getRefCells: function (formula, colLimited, rowLimited) {
            return this._parse(formula, false, colLimited, rowLimited);
        },
        parse: function (formula) {
            return this._parse(formula, null);
        },
        calculate: function (formula, cellsMap, colLimited, rowLimited) {
            return this._parse(formula, cellsMap || true, colLimited, rowLimited);
        },
        _parse: function (formula, cellsMap, colLimited, rowLimited) {
            var ret, ns = this,
                Supported = ns.Supported,
                RANGE = function (cellsMap, cellStart, cellStop) {
                    var arr = ns.getCellRanges(cellStart, cellStop, colLimited, rowLimited), i = 0, l = arr.length;
                    for (; i < l; i++)
                        arr[i] = cellsMap[arr[i]];
                    return arr;
                },
                doParse = function (formula, CELLS) {
                    var cellHash, rtn, str = formula,
                        f = function (a) {
                            if (a[8]) {
                                if (cellHash) {
                                    if (!(a[8] in cellHash)) cellHash[a[8]] = 1;//ns.toCoordinate(a[8],-1);
                                }
                                return 'CELLS["' + a[8] + '"]';
                            } else if (a[6] && a[7]) {
                                if (cellHash) {
                                    var arr = ns.getCellRanges(a[6], a[7], colLimited, rowLimited);
                                    for (var i = 0, l = arr.length; i < l; i++)
                                        if (!(arr[i] in cellHash)) cellHash[arr[i]] = 1;//ns.toCoordinate(arr[i],-1);
                                }
                                return 'RANGE(CELLS, "' + a[6] + '","' + a[7] + '")';
                            } else if (a[10] && a[11]) {
                                return 'Supported["' + a[10] + '"]' + a[11];
                            }
                        };
                    cellHash = {};
                    if (!ns.validate(str))
                        return false;
                    if (xui.isFun(str)) str = str + '';
                    else str = str.replace(/^\s*\=\s*/, '');
                    if (/function\s*\(/.test(str)) {
                        str = xui.fun.body(str);
                        str = xui.replace(str, [
                            // protect all
                            [/\/\*[^*]*\*+([^\/][^*]*\*+)*\//, '$0'],
                            [/\/\/[^\n]*/, '$0'],
                            [/\/(\\[\/\\]|[^*\/])(\\.|[^\/\n\\])*\/[gim]*/, '$0'],
                            [/"(\\.|[^"\\])*"/, '$0'],
                            [/'(\\.|[^'\\])*'/, '$0'],
                            // replace cells
                            [/\b([A-Z]+[\d]+)\b/, function (a) {
                                cellHash[a[0]] = 1;
                                return a[0];
                            }]
                        ]);
                        try {
                            if (cellsMap === false) {
                                rtn = cellHash;
                            } else {
                                if (cellsMap === true) cellsMap = {};

                                var pre = "var map=arguments[0]";
                                xui.each(cellHash, function (o, i) {
                                    pre += ", \n";
                                    pre += i + " = map['" + i + "']"
                                });
                                str = pre + ";\n" + str;

                                rtn = xui.isHash(cellsMap) ? (new Function("", str)).call(null, CELLS, formula) : str;
                            }
                        } catch (e) {
                            xui._debugInfo("throw", "#VALUE! ", formula, str, e);
                        } finally {
                            return rtn;
                        }
                    } else {
                        str = xui.replace(str, [
                            // protect "" and ''
                            [/"(\\.|[^"\\])*"/, '$0'],
                            [/'(\\.|[^'\\])*'/, '$0'],
                            // replace cells
                            [/([A-Z\d]+)\s*\:\s*([A-Z\d]+)/, f],
                            [/[A-Z]+[\d]+/, f],
                            [/([A-Z]+)(\s*\()/, f],
                            // replace expressions
                            [/[=<>]+/g, function (a) {
                                return a[0] == '=' ? '==' : a[0] == '<>' ? '!=' : a[0]
                            }]
                        ]);
                        try {
                            if (cellsMap === false) {
                                rtn = cellHash;
                            } else {
                                if (cellsMap === true) cellsMap = {};
                                rtn = xui.isHash(cellsMap) ? eval(str) : str;
                            }
                        } catch (e) {
                            xui._debugInfo("throw", "#VALUE! ", formula, str, e);
                        } finally {
                            return rtn;
                        }
                    }
                };

            ret = doParse(formula, cellsMap);

            return xui.isNaN(ret) ? false : ret;
        }
    }
});xui.Class("xui.APICaller", "xui.absObj", {
    Instance: {
        _ini: xui.Timer.prototype._ini,
        _after_ini: function (profile, ins, alias) {
            if (!profile.name) profile.Instace.setName(alias);
        },
        destroy: function () {
            this.each(function (profile) {
                var box = profile.box, name = profile.properties.name;
                //delete from pool
                delete box._pool[name];
                //free profile
                profile.__gc();
            });
        },
        setHost: function (value, alias) {
            var self = this;
            if (value && alias)
                self.setName(alias);
            return arguments.callee.upper.apply(self, arguments);
        },

        setQueryData: function (data, path) {
            return this.each(function (prf) {
                if (path) xui.set(prf.properties.queryArgs, (path || "").split("."), data);
                else prf.properties.queryArgs = data || {};
            });
        },


        invoke: function (onSuccess, onFail, onStart, onEnd, mode, threadid, options) {
            var ns = this, nns = ns,
                con = ns.constructor,
                prf = ns.get(0),
                prop = prf.properties;

            var responseType = prop.responseType,
                requestType = prop.requestType,
                requestId = prop.requestId,
                isAllform = prop.isAllform,
                queryURL = prop.queryURL,
                proxyType = prop.proxyType.toLowerCase(),
                queryUserName = prop.queryUserName,
                queryPasswrod = prop.queryPasswrod,
                queryArgs = xui.clone(prop.queryArgs),
                oAuth2Token = prop.oAuth2Token,
                queryOptions = xui.clone(prop.queryOptions),
                queryHeader = xui.clone(prop.queryHeader),
                requestDataSource = prop.requestDataSource,
                responseDataTarget = prop.responseDataTarget,
                responseCallback = prop.responseCallback,
                funs = xui.$cache.functions,
                t1 = funs['$APICaller:beforeInvoke'],
                t2 = funs['$APICaller:beforeData'],
                t3 = funs['$APICaller:onError'];

            queryURL = xui.adjustVar(queryURL);

            if (proxyType == "sajax") proxyType = "jsonp";
            else if (proxyType == "iajax") proxyType = "xdmi";
            if (requestType == "FORM" || requestType == "JSON") queryArgs = typeof queryArgs == 'string' ? xui.unserialize(queryArgs) : queryArgs;
            if (!queryArgs) queryArgs = {};
            if (prop.avoidCache) {
                var i = 0, rnd = "_rand_";
                while (queryArgs.hasOwnProperty(rnd)) rnd = "_rand_" + ++i;
                queryArgs[rnd] = xui.rand();
            }
            queryArgs['_currClassName_'] = prf.host.key;
            // merge request data
            if (requestDataSource && requestDataSource.length) {

                for (var i in requestDataSource) {
                    var o = requestDataSource[i], t, v, path;
                    switch (o.type) {
                        case "form":
                            if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.absContainer']) {
                                if (!prop.autoRun && (!t.checkValid() || !t.checkRequired())) {
                                    return;
                                } else {
                                    if (isAllform) {
                                        path = (o.path || "").split('.');

                                        if (xui.isHash(v = xui.get(queryArgs, path))) {
                                            if (o.name == 'pagectx') {
                                                xui.merge(v, t.getFormValues())
                                            } else {
                                                xui.merge(v, t.getAllFormValues(), 'all');
                                            }
                                        } else {
                                            xui.set(queryArgs, path, t.getAllFormValues());
                                        }

                                    } else {
                                        path = (o.path || "").split('.');
                                        if (xui.isHash(v = xui.get(queryArgs, path))) {
                                            if (o.name == 'pagectx') {
                                                xui.merge(v, t.getFormValues())
                                            } else {
                                                xui.merge(v, t.getFormValues(), 'all')
                                            }
                                        } else {
                                            xui.set(queryArgs, path, t.getFormValues());
                                        }
                                    }

                                }
                            }
                            break;
                    }
                }

                for (var i in requestDataSource) {
                    var o = requestDataSource[i], t, v, path;
                    switch (o.type) {
                        case "databinder":
                            if (t = xui.DataBinder.getFromName(o.name)) {
                                if (!t.updateDataFromUI()) {
                                    return;
                                } else {
                                    path = (o.path || "").split('.');
                                    if (xui.isHash(v = xui.get(queryArgs, path))) xui.merge(v, t.getData(), 'all');
                                    else xui.set(queryArgs, path, t.getData());
                                }
                            }
                            break;

                        case "spa":
                            if (window['SPA']) {
                                xui.set(queryArgs, o.path, SPA[o.name]);
                            }
                            break;
                        case "rad":
                            if (window['SPA']) {
                                switch (o.name) {
                                    case 'select':
                                        var items = SPA.getSelected();
                                        var itemids = [];
                                        xui.each(items, function (item) {
                                            itemids.push(item.alias);
                                        });
                                        xui.set(queryArgs, o.path, itemids);
                                        break;
                                }

                            }
                            break;

                        case "treeview":
                            if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.TreeView'] /*&& t.getRootNode()*/) {
                                path = (o.path || "id").split('.');
                                if (!t.getUIValue() || t.getUIValue() == '') {
                                    if (t.getSelectedItem()) {
                                        xui.set(queryArgs, path, t.getSelectedItem().id);
                                    }
                                } else {
                                    xui.set(queryArgs, path, t.getUIValue());
                                }

                                if (t.getSelectedItem() && t.getSelectedItem().tagVar) {
                                    xui.merge(queryArgs, t.getSelectedItem().tagVar, 'all');

                                }
                            }
                            break;

                        case "gallery":
                            if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.Gallery'] /*&& t.getRootNode()*/) {
                                path = (o.path || "id").split('.');
                                if (!t.getUIValue() || t.getUIValue() == '') {
                                    if (t.getSelectedItem()) {
                                        xui.set(queryArgs, path, t.getSelectedItem().id);

                                    }
                                } else {
                                    xui.set(queryArgs, path, t.getUIValue());
                                }
                                if (t.getSelectedItem() && t.getSelectedItem().tagVar) {
                                    xui.merge(queryArgs, t.getSelectedItem().tagVar, 'all');
                                }

                            }
                            break;


                        case "treegrid":
                            if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.TreeGrid'] /*&& t.getRootNode()*/) {
                                path = (o.path || (t.getUidColumn() && t.getUidColumn())).split('.');
                                if (!t.getUIValue() || t.getUIValue() == '') {
                                    if (t.getActiveRow('map')) {
                                        xui.set(queryArgs, path, t.getActiveRow('map')[t.getUidColumn()]);
                                    }
                                } else {
                                    xui.set(queryArgs, path, t.getUIValue());
                                }
                            }
                            break;

                        case "treegridrow":
                            if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.TreeGrid'] /*&& t.getRootNode()*/) {
                                path = (o.path || (t.getUidColumn() && t.getUidColumn())).split('.');
                                if (t.getActiveRow('map')) {
                                    xui.set(queryArgs, path, t.getActiveRow('map')[t.getUidColumn()]);
                                }
                            }
                            break;

                        case "pagebar":
                            if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.PageBar'] /*&& t.getRootNode()*/) {
                                var pageparams = {
                                    pageSize: t.getPageCount(),
                                    pageIndex: t.getPage()
                                };
                                if (xui.isHash(v = xui.get(queryArgs, path))) xui.merge(v, pageparams, 'all');
                                else xui.set(queryArgs, path, pageparams);
                            }
                            break;
                    }
                }
            }
            // the global handler
            if (xui.isFun(t1) && false === t1(requestId, prf))
                return;
            else if (xui.isHash(t1) && xui.isArr(t1.actions)
                && false === xui.pseudocode._callFunctions(t1, [requestId, prf], ns.getHost(), null, null, '$APICaller:beforeInvoke')
            )
                return;
            // Normally, Gives a change to modify "queryArgs" for XML
            if (prf.beforeInvoke && false === prf.boxing().beforeInvoke(prf, requestId))
                return;

            // for auto adjusting options
            var rMap = {header: {}};
            if (!xui.isEmpty(queryHeader)) {
                xui.merge(rMap.header, queryHeader);
            }
            if (queryOptions.header && !xui.isEmpty(queryOptions.header)) {
                xui.merge(rMap.header, queryOptions.header);
                delete queryOptions.header;
            }
            if (responseType == 'SOAP' || requestType == 'SOAP') {
                // for wsdl
                if (!con.WDSLCache) con.WDSLCache = {};
                if (!con.WDSLCache[queryURL]) {
                    var wsdl = xui.SOAP.getWsdl(queryURL, function (rspData) {
                        if (prf.afterInvoke) prf.boxing().afterInvoke(prf, rspData, requestId);

                        // the global handler
                        if (xui.isFun(t3)) t3(rspData, requestId, prf);
                        else if (xui.isHash(t3) && xui.isArr(t3.actions)) xui.pseudocode._callFunctions(t3, [rspData, requestId, prf], ns.getHost(), null, null, '$APICaller:onError');

                        if (prf.onError) prf.boxing().onError(prf, rspData, requestId);
                        xui.tryF(onFail, arguments, this);
                        xui.tryF(onEnd, arguments, this);
                    });
                    if (wsdl)
                        con.WDSLCache[queryURL] = wsdl;
                    else
                    // stop the further call
                        return;
                }
            }
            switch (responseType) {
                case "TEXT":
                    rMap.rspType = "text";
                case "JSON":
                    rMap.rspType = "json";
                    break;
                case "XML":
                    proxyType = "ajax";
                    rMap.rspType = "xml";
                    break;
                case "SOAP":
                    proxyType = "ajax";
                    rMap.rspType = "xml";
                    var namespace = xui.SOAP.getNameSpace(con.WDSLCache[queryURL]),
                        action = ((namespace.lastIndexOf("/") != namespace.length - 1) ? namespace + "/" : namespace) + (queryArgs.methodName || "");
                    rMap.header["SOAPAction"] = action;
                    break;
            }
            switch (requestType) {
                case "FORM":
                    // ensure object
                    queryArgs = typeof queryArgs == 'string' ? xui.unserialize(queryArgs) : queryArgs;
                    break;
                case "JSON":
                    rMap.reqType = "json";

                    if (prop.queryMethod == "auto")
                        rMap.method = "POST";
                    // ensure string
                    queryArgs = typeof queryArgs == 'string' ? queryArgs : xui.serialize(queryArgs);
                    break;
                case "XML":
                    rMap.reqType = "xml";
                    proxyType = "ajax";
                    rMap.method = "POST";
                    if (queryUserName && queryPassword) {
                        rMap.username = queryUserName;
                        rMap.password = queryPassword;
                        rMap.header["Authorization"] = "Basic " + con._toBase64(queryUserName + ":" + queryPassword);
                    }
                    // ensure string
                    queryArgs = typeof queryArgs == 'string' ? queryArgs : xui.XMLRPC.wrapRequest(queryArgs);
                    break;
                case "SOAP":
                    rMap.reqType = "xml";
                    proxyType = "ajax";
                    rMap.method = "POST";
                    if (queryUserName && queryPassword) {
                        rMap.username = queryUserName;
                        rMap.password = queryPassword;
                        rMap.header["Authorization"] = "Basic " + con._toBase64(queryUserName + ":" + queryPassword);
                    }
                    // ensure string
                    queryArgs = typeof queryArgs == 'string' ? queryArgs : xui.SOAP.wrapRequest(queryArgs, con.WDSLCache[queryURL]);
                    break;
            }
            if (oAuth2Token)
                rMap.header["Authorization"] = "Bearer " + oAuth2Token;

            // Ajax/JSONP/XDMI
            if (proxyType != "ajax")
                rMap.asy = true;
            if (proxyType == "jsonp")
                rMap.method = "GET";

            options = options || {};
            if (!("asy" in options))
                options.asy = !!prop.queryAsync;
            if (!("method" in options) && prop.queryMethod != "auto")
                options.method = prop.queryMethod;
            if (!("onEnd" in options))
                options.onEnd = onEnd;
            if (!("onStart" in options))
                options.onStart = onStart;

            xui.merge(options, queryOptions);

            xui.merge(options, rMap, 'all');
            options.proxyType = proxyType;

            if (xui.isEmpty(options.header)) {
                delete options.header;
            }
            var cookies = {}, t;
            if (!xui.isEmpty(prop.fakeCookies)) {
                options.$onStart = function () {
                    xui.each(prop.fakeCookies, function (v, k) {
                        if (xui.isSet(t = xui.Cookies.get(k))) {
                            cookies[k] = t;
                            xui.Cookies.remove(k);
                        }
                    });
                    xui.Cookies.set(prop.fakeCookies, 1, "/");
                }
            }
            if (!xui.isEmpty(prop.fakeCookies)) {
                options.$onEnd = function () {
                    xui.each(prop.fakeCookies, function (v, k) {
                        xui.Cookies.remove(k);
                    });
                    xui.Cookies.set(cookies);
                };
            }
            var ajax = xui._getrpc(queryURL, queryArgs, options).apply(null, [queryURL, queryArgs, function (rspData) {
                    var mapb, t;
                    // ensure to json
                    if ((responseType == "XML" || responseType == "SOAP") && !xui.isHash(rspData)) {
                        if (xui.isStr(rspData))
                            rspData = xui.XML.parseXML(rspData);
                        if (responseType == "XML")
                            rspData = xui.XMLRPC.parseResponse(rspData);
                        else if (responseType == "SOAP")
                            rspData = xui.SOAP.parseResponse(rspData, queryArgs.methodName, con.WDSLCache[queryURL]);
                    }
                    // Normally, Gives a change to modify the "rspData"
                    if (prf.afterInvoke) {
                        mapb = prf.boxing().afterInvoke(prf, rspData, requestId);
                        if (xui.isSet(mapb)) rspData = mapb;
                        mapb = null;
                    }

                    // the global handler
                    if (xui.isFun(t2) && false === t2(rspData, requestId, prf)) {
                        return false;
                    } else if (xui.isHash(t2) && xui.isArr(t2.actions)
                        && false === xui.pseudocode._callFunctions(t2, [rspData, requestId, prf], ns.getHost(), null, null, '$APICaller:beforeData')
                    ) {
                        return false;
                    }
                    if (prf.beforeData && false === prf.boxing().beforeData(prf, rspData, requestId)) {
                        return false;
                    }
                    //
                    // try {
                    //     if (rspData.requestStatus == -1 && rspData.errdes) {
                    //         xui.message(rspData.errdes, "服务器出错了！");
                    //     }
                    // } catch (e) {
                    //     xui.message(rspData.errdes, "服务器出错了！");
                    // }


                    if (responseDataTarget && responseDataTarget.length && rspData.requestStatus != -1) {
                        xui.arr.each(responseDataTarget, function (o) {
                                var data = o.path ? xui.get(rspData, o.path.split('.')) : rspData, ids = rspData.ids,
                                    ctx = rspData.ctx, t,
                                    funs = rspData.funs;


                                if (prf.getModule() && ctx && xui.isHash(ctx)) {
                                    var pagectx = prf.getModule().getCtxComponents();
                                    if (pagectx && pagectx.boxing) {
                                        pagectx.boxing().setFormValues(ctx);
                                    }
                                }
                                ;
                                switch (o.type) {
                                    case "alert":
                                        data = xui.stringify(data);
                                        if (xui.Coder) data = xui.Coder.formatText(data);
                                        alert(data);
                                        break;
                                    case "log":
                                        xui.log(data);
                                    case "treegrid":
                                        if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.TreeGrid'] /*&& t.getRootNode()*/) {
                                            t.removeAllRows();
                                            t.insertRows(data);
                                        } else if (prf.getModule()) {
                                            var module = prf.getModule(), ct = module.getChildByName(o.name);
                                            if (ct && ct.Class['xui.UI.TreeGrid']) {
                                                ct.removeAllRows();
                                                ct.insertRows(data);
                                            }
                                        }
                                        break;

                                    case "grid":  //兼容处理treegrid
                                        if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.TreeGrid'] /*&& t.getRootNode()*/) {
                                            t.removeAllRows();
                                            t.insertRows(data);
                                        } else if (prf.getModule()) {
                                            var module = prf.getModule(), ct = module.getChildByName(o.name);
                                            if (ct && ct.Class['xui.UI.TreeGrid']) {
                                                ct.removeAllRows();
                                                ct.insertRows(data);
                                            }
                                        }
                                        break;
                                    case "pagebar":
                                        if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.PageBar'] /*&& t.getRootNode()*/) {
                                            t.setTotalCount(data);
                                            t.setEvents("onPageSet", function (profile, page, start, count, eventType, opage, ostart) {
                                                nns.invoke();
                                            });
                                        } else if (prf.getModule()) {
                                            var module = prf.getModule(), ct = module.getChildByName(o.name);
                                            if (ct && ct.Class['xui.UI.PageBar']) {
                                                ct.setTotalCount(data);
                                                ct.setEvents("onPageSet", function (profile, page, start, count, eventType, opage, ostart) {
                                                    nns.invoke();
                                                });
                                            }
                                        }
                                        break;
                                    case "treeview":
                                        if ((t = xui.get(prf, ["host", o.name])) && (t.Class['xui.UI.TreeView'] || t.Class['xui.UI.TreeBar']) /*&& t.getRootNode()*/) {
                                            t.clearItems();
                                            t.setItems(data);
                                            if (ids && xui.isArr(ids)) {
                                                if (!t.getProperties('selMode') || t.getProperties('selMode') == 'none' || t.getProperties('selMode') == 'single') {
                                                    t.fireItemClickEvent(ids[0])
                                                } else {
                                                    t.setValue(ids.join(t.getProperties('valueSeparator')));
                                                }
                                            } else if (data && data.length > 0 && t.getProperties('selMode') && !t.getProperties('selMode') == 'none' && !t.getProperties('selMode') == 'single') {

                                                t.fireItemClickEvent(data[0].id)
                                            }

                                        } else if (prf.getModule()) {
                                            var module = prf.getModule(), ct = module.getChildByName(o.name);
                                            if (ct && (ct.Class['xui.UI.TreeView'] || ct.Class['xui.UI.TreeBar'])) {
                                                ct.clearItems();
                                                ct.setItems(data);
                                                if (!ct.getProperties('selMode') || ct.getProperties('selMode') == 'none' || ct.getProperties('selMode') == 'single') {
                                                    if (ids && xui.isArr(ids)) {
                                                        ct.fireItemClickEvent(ids[0])
                                                    } else {
                                                        ct.setValue(ids.join(t.getProperties('valueSeparator')));
                                                    }
                                                } else if (data.length > 0 && ct.getProperties('selMode') && !ct.getProperties('selMode') == 'none' && !ct.getProperties('selMode') == 'single') {
                                                    ct.fireItemClickEvent(data[0].id)
                                                }
                                            }
                                        }
                                        break;

                                    case "tabs":
                                        var target;
                                        if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.Tabs']) {
                                            target = t;
                                        } else if (prf.getModule()) {
                                            var module = prf.getModule(), ct = module.getChildByName(o.name);
                                            if ((ct && t.Class['xui.UI.Tabs'])) {
                                                target = ct;
                                            }
                                        }
                                        if (target) {
                                            target.clearItems();
                                            target.setItems(data);


                                            if (ids && xui.isArr(ids)) {
                                                target.fireItemClickEvent(ids[0])
                                            } else if (data.length > 0) {
                                                target.fireItemClickEvent(data[0].id)
                                            }
                                        }
                                        break;

                                    case "tree"://兼容处理treeview
                                        if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.TreeView'] /*&& t.getRootNode()*/) {
                                            t.clearItems();
                                            t.setItems(data);
                                            if (ids && xui.isArr(ids)) {
                                                t.setValue(data[data.length - 1]);
                                                t.fireItemClickEvent(ids[0])
                                            }
                                        } else if (prf.getModule()) {
                                            var module = prf.getModule(), ct = module.getChildByName(o.name);
                                            if (ct && ct.Class['xui.UI.TreeView']) {
                                                ct.clearItems();
                                                ct.setItems(data);
                                                if (ids && xui.isArr(ids)) {
                                                    ct.setValue(data[data.length - 1]);
                                                    ct.fireItemClickEvent(ids[0])
                                                }
                                            }
                                        }
                                        break;


                                    case "gallery":
                                        if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.Gallery'] /*&& t.getRootNode()*/) {
                                            t.clearItems();
                                            t.setItems(data);
                                            if (ids && xui.isArr(ids)) {
                                                t.setValue(data[data.length - 1]);
                                                t.fireItemClickEvent(ids[0])
                                            }
                                        } else if (prf.getModule()) {
                                            var module = prf.getModule(), ct = module.getChildByName(o.name);
                                            if (ct && ct.Class['xui.UI.Gallery']) {
                                                ct.clearItems();
                                                if (ids && xui.isArr(ids)) {
                                                    ct.setValue(data[data.length - 1]);
                                                    ct.fireItemClickEvent(ids[0])
                                                }
                                                ct.setItems(data);
                                            }
                                        }
                                        break;
                                    case "svgpaper":
                                        if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.UI.SVGPaper'] /*&& t.getRootNode()*/) {
                                            t.clearItems();
                                            t.setChildren(data);
                                        } else if (prf.getModule()) {
                                            var module = prf.getModule(), ct = module.getChildByName(o.name);
                                            if (ct && ct.Class['xui.UI.SVGPaper']) {
                                                ct.clearItems();
                                                ct.setChildren(data);
                                            }
                                        }
                                        break;


                                    case "popmenu":
                                        var pageHost = prf.host;
                                        if (!pageHost.ViewMenuBar) {
                                            pageHost.ViewMenuBar = {};
                                        }
                                        if (pageHost.ViewMenuBar[data.id]) {
                                            pageHost.ViewMenuBar[data.id].destroy();
                                        }
                                        if (data.apis) {
                                            xui.each(data.apis, function (citem) {
                                                xui.create(citem.key)
                                                    .setAlias(citem.alias)
                                                    .setHost(pageHost, citem.alias)
                                                    .setEvents(xui.checkEvents(citem.events))
                                                    .setProperties(citem.properties);
                                            });
                                        }
                                        viewbar = xui.create(data.key)
                                            .setAlias(data.alias)
                                            .setHost(pageHost, data.alias)
                                            .setEvents(xui.checkEvents(data.events))
                                            .setProperties(data.properties);
                                        //  .setTagVar(data.tagVar)
                                        if (data.tagVar) {
                                            viewbar.setTagVar(data.tagVar);
                                        }
                                        if (data.pos && data.pos.src) {
                                            viewbar.pop(data.pos.src);
                                        } else {
                                            viewbar.pop(data.pos);
                                        }
                                        pageHost.ViewMenuBar[data.id] = viewbar;
                                        break;

                                    case
                                    "component"
                                    :
                                        if ((t = xui.get(prf, ["host", o.name])) && (t.Class['xui.UI.Block'] || t.Class['xui.UI.Dialog'])/*&& t.getRootNode()*/) {
                                            t.setChildren(data);
                                            if (t.getModule().afterAppend) {
                                                t.getModule().afterAppend();
                                            }
                                        } else if (prf.getModule()) {
                                            var module = prf.getModule(), ct = module.getChildByName(o.name);
                                            if (ct && (ct.Class['xui.UI.Block'] || ct.Class['xui.UI.Dialog'])) {
                                                ct.setChildren(data);
                                            }
                                        }
                                        break;
                                    case
                                    "expression"
                                    :
                                        var map = {};
                                        xui.each(data, function (o) {
                                            map[o.alias] = o.properties;
                                        });
                                        if (t = xui.get(prf, ["host", o.name])) {
                                            t.getModule().setData(map);
                                        } else {
                                            prf.getModule().setData(map);
                                        }
                                        break;

                                    case
                                    "spa":
                                        if (SPA) {
                                            xui.each(data, function (o) {
                                                SPA._updateComponent(o);
                                            });
                                        }
                                        break;
                                    case
                                    "databinder"
                                    :
                                        if (t = xui.DataBinder.getFromName(o.name)) {
                                            t.setData(data);
                                            t.updateDataToUI();
                                        }
                                        break;
                                    case
                                    "form"
                                    :
                                        if ((t = xui.get(prf, ["host", o.name])) && t.Class['xui.absContainer'] /*&& t.getRootNode()*/) {
                                            t.setFormValues(data);
                                            t.checkValid(true);
                                        } else if (prf.getModule()) {
                                            var module = prf.getModule(), ct = module.getChildByName(o.name);
                                            if (ct && ct.Class['xui.UI.absContainer']) {
                                                ct.setFormValues(data);
                                                t.checkValid(true);
                                            }
                                        }

                                        break;
                                }
                            }
                        );
                    }
                    if (responseCallback && responseCallback.length) {
                        xui.arr.each(responseCallback, function (o) {
                            var t, host;
                            switch (o.type) {
                                case "host":
                                    if ((t = ns.getHost()) && (t = t.functions) && (t = t[o.name])) {
                                        host = ns.getHost();
                                    }
                                    break;
                                default:
                                    if ((t = xui.$cache.functions[o.name])) {
                                        host = null;
                                    }
                                    break;
                            }
                            if (t && t.actions && xui.isArr(t.actions)) {
                                xui.pseudocode._callFunctions(t, [rspData, ns], host, null, null, (host && host.alias) + "." + ns.alias + "." + o.name);
                            }
                        });
                    }

                    if (rspData && rspData.requestStatus) {
                        if (rspData.requestStatus == -1) {
                            if (prf.onExecuteError) prf.boxing().onExecuteError(prf, rspData, requestId);
                        } else {
                            if (prf.onExecuteSuccess) prf.boxing().onExecuteSuccess(prf, rspData, requestId);
                        }
                    }

                    if (prf.onData) prf.boxing().onData(prf, rspData, requestId);
                    xui.tryF(onSuccess, arguments, this);

                },

                    function (rspData) {
                        if (prf.afterInvoke) prf.boxing().afterInvoke(prf, rspData, requestId);

                        if (responseDataTarget && responseDataTarget.length) {
                            xui.arr.each(responseDataTarget, function (o, t) {
                                switch (o.type) {
                                    case "alert":
                                        rspData = xui.stringify(rspData);
                                        if (xui.Coder) rspData = xui.Coder.formatText(rspData);
                                        alert(rspData);
                                        break;
                                    case "log":
                                        xui.log(rspData);
                                        break;
                                }
                            });
                        }

                        // the global handler
                        if (xui.isFun(t3)) t3(rspData, requestId, prf);
                        else if (xui.isHash(t3) && xui.isArr(t3.actions)) xui.pseudocode._callFunctions(t3, [rspData, requestId, prf], ns.getHost(), null, null, '$APICaller:onError');

                        if (prf.onError) prf.boxing().onError(prf, rspData, requestId);
                        xui.tryF(onFail, arguments, this);
                    }

                    ,
                    threadid, options
                ])
            ;

            if (mode == "quiet")
                ajax.start();
            else if (mode == "return")
                return ajax;
            else
                xui.observableRun(function (threadid) {
                    ajax.threadid = threadid;
                    ajax.start();
                });
        }
    },
    Static: {
        WDSLCache: {}
        ,
        $nameTag: "api_",
        _pool:
            {}
        ,
        _objectProp: {
            tagVar: 1,
            propBinder:
                1,
            queryArgs:
                1,
            queryHeader:
                1,
            queryOptions:
                1,
            fakeCookies:
                1,
            requestDataSource:
                1,
            responseDataTarget:
                1,
            responseCallback:
                1
        }
        ,
        destroyAll: function () {
            this.pack(xui.toArr(this._pool, false), false).destroy();
            this._pool = {};
        }
        ,
        getFromName: function (name) {
            var o = this._pool[name];
            return o && o.boxing();
        }
        ,
        _toBase64: function (str) {
            var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
                arr = [],
                i = 0,
                c1, c2, c3, e1, e2, e3, e4;
            do {
                c1 = str.charCodeAt(i++);
                c2 = str.charCodeAt(i++);
                c3 = str.charCodeAt(i++);
                e1 = c1 >> 2;
                e2 = ((c1 & 3) << 4) | (c2 >> 4);
                e3 = ((c2 & 15) << 2) | (c3 >> 6);
                e4 = c3 & 63;
                if (isNaN(c2)) e3 = e4 = 64;
                else if (isNaN(c3)) e4 = 64;
                arr.push(keyStr.charAt(e1) + keyStr.charAt(e2) + keyStr.charAt(e3) + keyStr.charAt(e4));
            } while (i < str.length);
            return arr.join('');
        }
        ,
        _beforeSerialized: xui.Timer._beforeSerialized,
        DataModel:
            {
                dataBinder: null,
                dataField:
                    null,
                requestId:
                    "",
                queryAsync:
                    true,
                autoRun:
                    false,
                isAllform:
                    false,
                queryURL:
                    "",
                avoidCache:
                    true,
                oAuth2Token:
                    "",
                queryUserName:
                    "",
                queryPassword:
                    "",

                queryMethod:
                    {
                        ini: "auto",
                        listbox:
                            ["auto", "GET", "POST", "PUT", "DELETE"]
                    }
                ,
                requestType: {
                    ini: "FORM",
                    listbox:
                        ["FORM", "JSON", "XML", "SOAP"]
                }
                ,
                responseType: {
                    ini: "JSON",
                    listbox:
                        ["JSON", "TEXT", "XML", "SOAP"]
                }
                ,

                requestDataSource: {
                    ini: []
                }
                ,
                responseDataTarget: {
                    ini: []
                }
                ,
                responseCallback: {
                    ini: []
                }
                ,

                queryArgs: {
                    ini: {}
                }
                ,
                queryHeader: {
                    ini: {}
                }
                ,
                queryOptions: {
                    ini: {}
                }
                ,
                fakeCookies: {
                    ini: {}
                }
                ,
                proxyType: {
                    ini: "auto",
                    listbox:
                        ["auto", "AJAX", "JSONP", "XDMI"]// Cross-Domain Messaging with iframes
                }
                ,
                "name":
                    {
                        set: function (value) {
                            var o = this,
                                ovalue = o.properties.name,
                                c = o.box,
                                _p = c._pool,
                                _old = _p[ovalue],
                                _new = _p[value],
                                ui;

                            //if it exists, overwrite it dir
                            //if(_old && _new)
                            //    throw value+' exists!';

                            _p[o.properties.name = value] = o;

                            //pointer _old the old one
                            if (_new && !_old) o._n = _new._n;
                            //delete the old name from pool
                            if (_old) delete _p[ovalue];
                        }
                    }
                ,
                proxyInvoker: {
                    inner: true,
                    trigger:

                        function () {
                            var prf = this.get(0),
                                prop = prf.properties,
                                bak1 = prop.responseDataTarget,
                                bak2 = prop.responseCallback,
                                fun = function (d) {
                                    prop.responseDataTarget = bak1;
                                    prop.responseCallback = bak2;

                                    d = xui.stringify(d);
                                    if (xui.Coder) d = xui.Coder.formatText(d);
                                    alert(d);
                                };

                            prop.responseDataTarget = [];
                            prop.responseCallback = [];
                            this.invoke(fun, fun);
                        }
                }
            }
        ,
        EventHandlers: {
            beforeInvoke: function (profile, requestId) {
            }
            ,
            afterInvoke: function (profile, rspData, requestId) {
            }
            ,
            onData: function (profile, rspData, requestId) {
            }
            ,

            onExecuteSuccess: function (profile, rspData, requestId) {
            }
            ,

            onExecuteError: function (profile, rspData, requestId) {
            }
            ,

            beforeData: function (profile, rspData, requestId) {
            }
            ,
            onError: function (profile, rspData, requestId) {
            }
        }
    }
})
;xui.Class("xui.MQTT","xui.absObj",{
    Instance:{
       _ini:xui.Timer.prototype._ini,
        _after_ini:function(prf){
            var prop=prf.properties, fun=function(){
                xui.asyRun(function(){
                    if(!prf.$inDesign && !(prf.host && prf.host.$inDesign)){
                        if(prop.autoConn){
                            prf.boxing().connect();
                        }
                    }
                });
            };
            if(xui.get(window,"Paho.Client"))fun();
            else{
                xui.include("Paho.Client",prop.libCDN,function(){
                        if(prf && prf.box && fun) fun();
                },null,false,{cache:true});
            }
        },
        destroy:function(){
            this.each(function(prf){
                if(prf.$inDesign)return;
                prf.boxing().disconnect();
                //free prf
                prf.__gc();
            });
        },
        getParent:xui.Timer.prototype.getParent,
        getChildrenId:xui.Timer.prototype.getChildrenId,

        connect:function(){
            var prf=this.get(0),prop=prf.properties,t,p,
                path=xui.str.trim(prop.path),
                server=xui.str.trim(prop.server);
            if(path.length && path[0]!="/")path="/"+path;

            t = prf.$mqtt = new Paho.Client(server, parseInt(prop.port,10), path, prop.clientId);
            t.onConnected = function(reconnect){
                if(prf.onConnSuccess)prf.boxing().onConnSuccess(prf,reconnect);
            };
            t.onConnectionLost = function(err){
                if(prf&&prf.box){
                    prf.boxing()._clear();
                    if(prf.onConnLost)prf.boxing().onConnLost(prf,err);
                }
            };
            t.onMessageDelivered = function(msgObj){
                if(prf.onMsgDelivered)prf.boxing().onMsgDelivered(prf,msgObj.payloadString,msgObj);
            };
            t.onMessageArrived = function(msgObj){
                var playloadObj={};
                try{  eval("playloadObj="+msgObj.payloadString)}catch(e){};
                if(prf.onMsgArrived)prf.boxing().onMsgArrived(prf,msgObj.payloadString,msgObj,playloadObj);
            };
            var opt={
                cleanSession: prop.cleanSession,
                useSSL: prop.useSSL,
                onSuccess:function(){
                    prf.$mqtt_connected=1;
                    prf.$mqtt_subed={};
                    if(prop && prop.autoSub){
                        xui.arr.each(prop.subscribers,function(sub){
                            var topic  = sub.topic || (sub+""),
                                opt=xui.isHash(sub)?xui.copy(sub):{};
                            delete opt.topic;
                            opt.qos=parseInt(opt.qos)||0;
                            prf.boxing().subscribe(topic, opt);
                        });
                    }
                },
                onFailure:function(e){
                    if(prf&&prf.box){
                        if(prf.onConnFailed)prf.boxing().onConnFailed(prf,e);
                        else xui.log(e.errorMessage+"["+e.errorCode+"]");
                        prf.boxing()._clear();
                    }
                }
            };
            if(p=prop.timeout)opt.timeout=p;
            if(p=prop.userName)opt.userName=p;
            if(p=prop.password)opt.password=p;
            if(p=prop.keepAliveInterval)opt.keepAliveInterval=p;
            if(prop.willTopic && prop.willMessage){
                var msg = new Paho.Message(willTopic);
                msg.destinationName = prop.willMessage;
                msg.qos=parseInt(prop.willQos)||0;
                msg.retained=prop.willRetained;
                opt.willMessage=msg;
            }
            t.connect(opt);
        },
        _clear:function(){
            var prf=this.get(0),t=prf.$mqtt;
            if(t){
                delete t.onConnected;
                delete t.onConnectionLost;
                delete t.onMessageDelivered;
                delete t.onMessageArrived;
            }
            delete prf.$mqtt_connected;
            delete prf.$mqtt_subed;
            delete prf.$mqtt;
        },
        disconnect:function(){
            var prf=this.get(0),t=prf.$mqtt;
            if(t&&prf.$mqtt_connected){
                t.disconnect();
            }
            this._clear();
        },
        subscribe:function(topic, option){
            var prf=this.get(0),prop=prf.properties,t=prf.$mqtt;
            if(t&&prf.$mqtt_connected){
                var opt=xui.isHash(option)?xui.copy(option):{};
                if(!prf.$mqtt_subed)prf.$mqtt_subed={};
                opt.qos=parseInt(opt.qos)||0;
                opt.onSuccess=function(){
                    prf.$mqtt_subed[topic]=new Date;
                    if(prf.onSubSuccess)prf.boxing().onSubSuccess(prf,e);
                };
                opt.onFailure=function(e){
                    delete prf.$mqtt_subed[topic];
                    if(prf.onSubFailed)prf.boxing().onSubFailed(prf,e,topic);
                };
                opt.timeout=prop.timeout;
                
                t.subscribe(topic, opt);
            }
        },
        unsubscribe:function(topic, option){
            var prf=this.get(0),prop=prf.properties,t=prf.$mqtt;
            if(t&&prf.$mqtt_connected && prf.$mqtt_subed && prf.$mqtt_subed[topic]){
                var opt=xui.isHash(option)?xui.copy(option):{};
                opt.onSuccess=function(){
                   delete prf.$mqtt_subed[topic];
                    if(prf.onUnsubSuccess)prf.boxing().onUnsubSuccess(prf,e);
                };
                opt.onFailure=function(e){
                    if(prf.onUnsubFailed)prf.boxing().onUnsubFailed(prf,e,topic);
                };
                opt.timeout=prop.timeout;
                
                t.unsubscribe(topic, opt);
            }
        },
        publish:function(topic, payload, qos, retained){
            var prf=this.get(0),prop=prf.properties,t=prf.$mqtt;
            if(t&&prf.$mqtt_connected && prf.$mqtt_subed && prf.$mqtt_subed[topic]){
                t.publish(topic, typeof(payload)=='string'?payload:xui.stringify(payload), parseInt(qos)||0, retained||false);
            }
        }
    },
    Static:{
        _objectProp:{tagVar:1,propBinder:1,subscribers:1},
        _beforeSerialized:xui.Timer._beforeSerialized,
        DataModel:{
            dataBinder:null,
            dataField:null,
            libCDN:"/RAD/xui/js/mqtt/paho-mqtt-min.js",

            autoConn:true,
            autoSub:true,
            subscribers:[],

            server:"mqtt.itjds.net",
            port:"81",
            path:"ws",
            clientId:"xui_mqtt_client",
            
            timeout:30,
            userName:"",
            password:"",
            keepAliveInterval:60,
            cleanSession:true,
            useSSL:true,
            reconnect:true,

            willTopic:"",
            willMessage:"",
            willQos:{
                ini:0,
                listbox:[0,1,2]
            },
            willRetained:false
        },
        EventHandlers:{
            onConnSuccess: function(profile, reconnect){},
            onConnFailed: function(profile, error){},
            onConnLost: function(profile, error){},
            onSubSuccess: function(profile, topic){},
            onSubFailed: function(profile, error, topic){},
            onUnsubSuccess: function(profile, topic){},
            onUnsubFailed: function(profile, error, topic){},
            onMsgDelivered: function(profile, payloadString, msgObj){},
            onMsgArrived: function(profile, payloadString, msgObj,playloadObj){}
        }
    }
});xui.Class("xui.DataBinder","xui.absObj",{
    Instance:{
        _ini:xui.Timer.prototype._ini,
        destroy:function(){
            this.each(function(profile){
                var box=profile.box,name=profile.properties.name;
                //unlink
                xui.arr.each(profile._n, function(v){if(v)box._unBind(name,v)});
                //delete from pool
                delete box._pool[name];
                //free profile
                profile.__gc();
            });
        },
        setHost:function(value, alias){
            var self=this;
            if(value && alias)
                self.setName(alias);
            return arguments.callee.upper.apply(self,arguments);
        },

        isDirtied:function(){
            var elems=this.constructor._getBoundElems(this.get(0));
            for(var i=0,l=elems.length;i<l;i++){
                var profile=elems[i],ins;
                if(profile.box["xui.absValue"]){
                    ins = profile.boxing();
                    if((ins.getUIValue()+" ")!==(ins.getValue()+" ")){
                        return true;
                    }
                }
            }
            return false;
        },
        checkValid:function(ignoreAlert){
            var result=true;
            // check required first
            if(!this.checkRequired(ignoreAlert)){
                return false;
            }
            xui.absValue.pack(this.constructor._getBoundElems(this.get(0)),false).each(function(prf){
                if(!prf.boxing().checkValid()){
                    if(!ignoreAlert){
                        if(!prf.beforeInputAlert || false!==prf.boxing().prf.beforeInputAlert(profile, prf, 'invalid')){
                            xui.alert('$inline.invalid',xui.getRes('$inline.invalid') + (prf.properties.labelCaption?(" : " +prf.properties.labelCaption):"")  , function(){
                                if(prf&&prf.renderId)
                                       prf.boxing().activate();
                            });
                        }
                        return result=false;
                    }
                     result=false;
                }
            });
            return result;
        },
        checkRequired:function(ignoreAlert){
            var result = true;
            xui.absValue.pack(this.constructor._getBoundElems(this.get(0)),false).each(function(prf){
                if(prf.properties.required && (!(i=prf.boxing().getUIValue())) && i!==0){
                    if(!ignoreAlert){
                        if(!prf.beforeInputAlert || false!==prf.boxing().prf.beforeInputAlert(profile, prf, 'required')){
                            xui.alert('$inline.required',xui.getRes('$inline.required') + (prf.properties.labelCaption?(" : " +prf.properties.labelCaption):"")  , function(){
                                if(prf&&prf.renderId)
                                       prf.boxing().activate();
                            });
                        }
                        return result=false;
                    }
                    result=false;
                }
            });
            return result;
        },

        // for UI Controls
        getUI:function(key){
            var r;
            if(!key)
                r=xui.UI.pack(this.constructor._getBoundElems(this.get(0)),false);
            else
                xui.arr.each(this.constructor._getBoundElems(this.get(0)),function(profile){
                    var p=profile.properties;
                    if((p.dataField || p.name || profile.alias)==key){
                        r=profile.boxing();
                        return false;
                    }
                });
            return r;
        },
        getUIValue:function(withCaption, dirtied){
            var ns=this,
                prf=ns.get(0),
                hash={};
            xui.arr.each(this.constructor._getBoundElems(prf),function(profile){
                if(!profile.box["xui.absValue"])return;
                var p=profile.properties,
                    ins = profile.boxing(),
                    // maybe return array
                    uv = ins.getUIValue(),
                    key = p.dataField || p.name || profile.alias, keys;
                // v and uv can be object(Date,Number)
                if(!dirtied || (uv+" ")!==(ins.getValue()+" ")){
                    if(ins.getCaption){
                        if(key.indexOf(":")!=-1){
                            keys=key.split(':');
                        }
                        if(keys && keys[0] && keys[1]){
                            hash[keys[0]]=uv;
                            hash[keys[1]]=ins.getCaption();
                        }else if(withCaption){
                            hash[key]={
                                value : uv,
                                caption : ins.getCaption()
                            };
                        }else{
                            hash[key]=uv;
                        }
                    }else{
                        hash[key]=uv;
                    }
                }
            });
            return hash;
        },
        // get dirtied UI Value
        getDirtied:function(withCaption){
            return this.getUIValue(withCaption, true);
        },
        getData:function(key, force, ignoreAlert){
            var prf=this.get(0);
            // refresh
            if(prf.$inDesign || force){
                prf.properties.data=  {};
                this.updateDataFromUI(false,false,false,null,null,ignoreAlert,false);
            }

            var data=prf.properties.data;
            return xui.isSet(key)?data[key]:data;
        },
        setData:function(key,value, force){
            var prf=this.get(0), prop=prf.properties;

            //clear data
            if(key===false){
                xui.each(prop.data,function(o,i){
                    prop.data[i]=null;
                });
            }
            // reset all data
            else if(!xui.isSet(key))
                prop.data={};
            // reset all data
            else if(xui.isHash(key))
                prop.data=key;
            // reset one
            else
                prop.data[key]=value;

            if(prf.$inDesign || force){
                this.updateDataToUI();
            }
            return this;
        },
        resetValue:function(){
            xui.arr.each(this.constructor._getBoundElems(this.get(0)), function(p,i){
                    if((i=p.properties.value) !== p.properties.$UIvalue)
                        p.boxing().resetValue(i);
            });
            return this;
        },
        clearValue:function(){
            xui.absValue.pack(this.constructor._getBoundElems(this.get(0)),false).resetValue(null);
            return this;
        },
        updateValue:function(){
            xui.absValue.pack(this.constructor._getBoundElems(this.get(0)),false).updateValue();
            return this;
        },
        updateDataFromUI:function(updateUIValue,withCaption,returnArr,adjustData,dataKeys,ignoreAlert,ignoreEvent){
            var ns=this,
                prf=ns.get(0),
                prop=prf.properties,
                map={},
                mapb;
            if(!ignoreAlert){
                // check valid first
                if(!ns.checkValid()){
                    return;
                }
                // and check required
                if(!ns.checkRequired()){
                    return;
                }
            }
            xui.merge(map,prop.data,function(v,t){
                return !dataKeys || dataKeys===t || (xui.isArr(dataKeys)?xui.arr.indexOf(dataKeys,t)!=-1:false);
            });
            xui.arr.each(ns.constructor._getBoundElems(prf),function(profile){
                var p=profile.properties,
                      eh=profile.box.$EventHandlers,
                      ins=profile.boxing(),
                      key=p.dataField || p.name || profile.alias, keys, cap;
                if(typeof(ins.setCaption)=="function" && key.indexOf(":")!=-1){
                    keys=key.split(":");
                    if(keys[1] && keys[2]){
                        key=keys[0];
                        cap=keys[1];
                    }
                }
                if(!dataKeys || dataKeys===key || (xui.isArr(dataKeys)?xui.arr.indexOf(dataKeys,key)!=-1:false)){
                    var b = profile.boxing(),capv,
                        // for absValue, maybe return array
                        uv = profile.box['xui.absValue']?b.getUIValue(xui.isBool(returnArr)?returnArr:profile.__returnArray):null;
                    // v and uv can be object(Date,Number)
                    if(xui.isHash(map[key])){
                        var pp=map[key].properties,theme=map[key].theme,cc=map[key].CC,ca=map[key].CA,cs=map[key].CS;

                        if(pp)delete map[key].properties;
                        if(theme)delete map[key].theme;
                        if(ca)delete map[key].CA;
                        if(cc)delete map[key].CC;
                        if(cs)delete map[key].CS;
                        // remove non-properties
                        xui.filter(map[key],function(o,i){
                            return !!(i in p);
                        });
                        // reset
                        if(!xui.isEmpty(map[key])){
                            xui.each(map[key],function(o,i){
                                if(i in p)map[key][i]=p[i];
                            });
                        }
                        // reset pp
                        if(xui.isHash(pp)){
                            xui.filter(pp,function(o,i){
                                return i in p && !(i in map[key]);
                            });
                            if(!xui.isEmpty(pp)){
                                xui.each(pp,function(o,i){
                                    if(i in p)pp[i]=p[i];
                                });                         
                                map[key].properties=pp
                            }
                        }
                         if(theme)map[key].theme=profile.theme;
                        if(ca)map[key].CA=xui.clone(profile.CA,true);
                        if(cc)map[key].CC=xui.clone(profile.CC,true);
                        if(cs)map[key].CS=xui.clone(profile.CS,true);

                        if('caption' in p && b.getCaption)
                        if(cap){
                            map[cap]=b.getCaption();
                        }else if('caption' in map[key] || withCaption)
                            if(pp&&'caption' in pp)pp.caption=b.getCaption();else map[key].caption=b.getCaption();
                        if(xui.isDefined(uv) && 'value' in p)
                            if(pp&&'value' in pp)pp.value=uv;else map[key].value=uv;
                    }else{
                        if(profile.box['xui.UI.ComboInput'] && (p.type=='file')){
                            map[key]=profile;
                        }else if('caption' in p){
                            capv=typeof(b.getCaption)=="function"?b.getCaption():p.caption;
                            if(cap){
                                map[key]=uv;
                                map[cap]=capv;
                            }else if(withCaption){
                                // igore unnecessary caption
                                if((!capv && !uv) || capv==uv)
                                    map[key]=uv;
                                else
                                    map[key]={value:uv, caption:capv};
                            }else{
                                map[key]=uv;
                            }
                        }else{
                            map[key]=uv;
                        }
                    }
                    // for absValue
                    if(updateUIValue!==false && profile.renderId && profile.box['xui.absValue'])
                        b.updateValue();
                }
            });

            // adjust UI data
            if(adjustData)
                map = xui.tryF(adjustData,[map, prf],this);

            if(!ignoreEvent && prf.afterUpdateDataFromUI){
                mapb = this.afterUpdateDataFromUI(prf, map);
                if(xui.isHash(mapb))map=mapb;
                mapb=null;
            }

            xui.merge(prf.properties.data,map,'all');

            return true;
        },
        updateDataToUI:function(adjustData, dataKeys, ignoreEvent){
            var key,keys,cap,ins,p,v,c,b,pp,uv,eh,
                ns=this,
                prf=ns.get(0),
                prop=prf.properties,
                map={},mapb;

            xui.merge(map,prop.data,function(v,t){
                return !dataKeys || dataKeys===t || (xui.isArr(dataKeys)?xui.arr.indexOf(dataKeys,t)!=-1:false);
            });

            if(adjustData)
                map = xui.tryF(adjustData,[map, prf],ns);

            if(!ignoreEvent && prf.beforeUpdateDataToUI){
                mapb = ns.beforeUpdateDataToUI(prf, map);
                if(xui.isHash(mapb))map=mapb;
                mapb=null;
            }

            xui.arr.each(ns.constructor._getBoundElems(prf),function(profile){
                p=profile.properties;
                eh=profile.box.$EventHandlers;
                key=p.dataField || p.name || profile.alias;
                ins=profile.boxing();
                if(typeof(ins.setCaption)=="function" && key.indexOf(":")!=-1){
                    keys=key.split(":");
                    if(keys[1] && keys[2]){
                        key=keys[0];
                        cap=keys[1];
                    }
                }

                if(!dataKeys || dataKeys===key || (xui.isArr(dataKeys)?xui.arr.indexOf(dataKeys,key)!=-1:false)){
                    // need reset?
                    if(map && key in map){
                        v=xui.clone(map[key],null,2);
                        uv=c=undefined;
                        b=profile.boxing();
                        if(xui.isHash(v)){
                            if(pp=v.properties){
                                xui.filter(pp,function(o,i){
                                    return i in p;
                                });
                                // keep value and caption at first
                                c= (cap&&pp[cap]) || (xui.isSet(pp.caption)?pp.caption:null);
                                uv=xui.isSet(pp.value)?pp.value:null;
                                delete pp.caption;delete pp.value;
                                if(!xui.isEmpty(pp))
                                    b.setProperties(pp);
                                delete v.properties;
                            }
                            if(pp=v.theme){if(typeof(b.setTheme)=="function")b.setTheme(pp);delete v.theme}
                            if(pp=v.CS){if(!xui.isEmpty(pp))b.setCustomStyle(pp);delete v.CS}
                            if(pp=v.CC){if(!xui.isEmpty(pp))b.setCustomClass(pp);delete v.CC}
                            if(pp=v.CA){if(!xui.isEmpty(pp))b.setCustomAttr(pp);delete v.CA}

                            if(!xui.isEmpty(v)){
                                xui.filter(v,function(o,i){
                                    return (i in p) || (i in v);
                                });
                                if(!xui.isEmpty(v)){
                                    // keep value and caption at first
                                    // value and caption in properties have high priority
                                    c=xui.isSet(c)?c:((cap&&pp[cap]) || xui.isSet(v.caption)?v.caption:null);
                                    uv=xui.isSet(uv)?uv:xui.isSet(v.value)?v.value:null;
                                    delete v.caption;delete v.value;
                                    
                                    if(!xui.isEmpty(v))
                                        b.setProperties(v);
                                }
                            }
                        }else{
                            uv=v;
                            c= (cap&&pp[cap]) || undefined;
                        }
                        // set value and caption at last
                        if(xui.isDefined(uv) && xui.isFun(b.resetValue)){
                            b.resetValue(uv);
                            profile.__returnArray=xui.isArr(uv);
                        }
                        // set caption
                        if(xui.isDefined(c) && xui.isFun(b.setCaption))
                            xui.tryF(b.setCaption,[c,true],b);
                    }
                }
            });
            return ns;
        }
    },
    Static:{
        $nameTag:"databinder_",
        _pool:{},
        _objectProp:{tagVar:1,propBinder:1,data:1},
        destroyAll:function(){
            this.pack(xui.toArr(this._pool,false),false).destroy();
            this._pool={};
        },
        getFromName:function(name){
            var o=this._pool[name];
            return o && o.boxing();
        },
        _beforeSerialized:xui.Timer._beforeSerialized,
        _getBoundElems:function(prf){
            var arr=[];
            xui.arr.each(prf._n,function(profile){
                // for container
                if(profile.behavior.PanelKeys){
                     xui.absValue.pack(profile.boxing().getChildren(null, true)).each(function(p){
                        arr.push(p);
                    });
                }
                // for absValue
                else if(profile.box['xui.absValue']){
                    arr.push(profile);
                }
            });
            return xui.arr.removeDuplicate(arr);
        },
        _bind:function(name, profile){
            if(!name)return;
            var o=this._pool[name];
            if(!o){
                b=new xui.DataBinder();
                b.setName(name);
                o=b.get(0);
            }
            if(profile){
                if(xui.arr.indexOf(o._n,profile)==-1){
                    //use link for 'destroy UIProfile' trigger 'auto unbind function '
                    profile.link(o._n, 'databinder.'+name);
                }
            }
        },
        _unBind:function(name, profile){
            if(profile && profile.box && this._pool[name])
                profile.unLink('databinder.'+name);
        },
        DataModel:{
            expression:{
                ini:'',
                action:function () {
                }
            },
            dataBinder:null,
            dataField:null,            
            "name":{
                set:function(value){
                    var o=this,
                        ovalue=o.properties.name,
                         c=o.box,
                        _p=c._pool,
                        _old=_p[ovalue],
                        _new=_p[value],
                        ui;

                    //if it exists, overwrite it dir
                    //if(_old && _new)
                    //    throw value+' exists!';

                    _p[o.properties.name=value]=o;
                    //modify name
                    if(_old && !_new && o._n.length)
                        for(var i=0,l=o._n.length;i<l;i++)
                            xui.set(o._n[i], ["properties","dataBinder"], value);

                    //pointer _old the old one
                    if(_new && !_old) o._n=_new._n;
                    //delete the old name from pool
                    if(_old)delete _p[ovalue];
                }
            },            
            "data":{
                ini:{}
            }
        },
        EventHandlers:{
            beforeInputAlert:function(profile, ctrlPrf, type){},
            beforeUpdateDataToUI:function(profile, dataToUI){},
            afterUpdateDataFromUI:function(profile, dataFromUI){}
        }
    }
});/* event
*  Dependencies: base _ ; Class ; xui ;
*/
xui.Class('xui.Event',null,{
    //Reserved: fordrag
    Constructor:function(event,node,fordrag,tid){
        var self = xui.Event,
            w=window,
            d=document,
            dd=0,id,t,
            dragdrop=xui.DragDrop,
            actions=[],
            src, pre, obj;

        //get event object , and src of event
        if(!(event=event||w.event) || !(src=node)){
            src=node=null;
            return false;
        }
        node=null;
 
        //type
        var type = event.type,
            xuievent=event.$xuievent,
            xuitype=event.$xuitype,
            xuiall=event.$xuiall;
        
        if(xui.browser. && type=="click" && xui.getData(['!document','$fakescrolling'])){
            return false;
        }

        // simulate for DD
        if(type=="xuitouchdown"){
            type="mousedown";
            xuievent=1;
            xuiall=0;
            xuitype="beforeMousedown";
        }

        //for correct mouse hover problems;
        if('mouseover'==type || 'mouseout'==type){
            dd=(dragdrop&&dragdrop._profile.isWorking)?1:2;
            //for droppable
            if(dd!=1 && fordrag){
                src=null;
                return self.$FALSE;
            }
            //don't return false, here, opera will stop the system event hander => cursor not change
            if(!self._handleMouseHover(event, src, dd==1)){
                src=null;
                return self.$FALSE;
            }
            if(dd==1)
                pre=dragdrop&&dragdrop._dropElement;
        //for tab focusHook
        }else if((obj=self._tabHookStack).length &&
            self._kb[type] &&
            (event.$key || event.keyCode || event.charCode)==9 &&
            false === self._handleTabHook(self.getSrc(event), obj=obj[obj.length-1])){
                src=null;
                return;
            }

        id = tid||self.getId(src);
        //get profile from dom cache
        if(obj = self._getProfile(id)){
            if(type=="DOMMouseScroll")
                type="mousewheel";
            //for setBlurTrigger
            if(type=='mousedown' || type=="mousewheel")
                xui.tryF(xui.Dom._blurTrigger,[obj,event]);
            //for resize
            else if(type=="resize"){
                type='size';
                //for IE, always fire window onresize event after any innerHTML action
                if(xui.browser.ie && w===src){
                    var w=xui.browser.contentBox && d.documentElement.clientWidth || d.body.clientWidth,
                        h=xui.browser.contentBox && d.documentElement.clientHeight || d.body.clientHeight;
                    if(obj._w==w&&obj._h==h){
                        src=null;
                        return;
                    }else{
                        obj._w=w;obj._h=h;
                    }
                }
            }

            var j, f, name, r=true, funs=[];
            //order by: before, on, after
            for(j=0; j<=2; ++j){
                // if in dd, effect beforeMouse(move/over/out) only
                if(dd==1 && j!==0 && !event.$force)break;
                // if not in dd, effect (on/after)Mouse(move/over/out) only
                if(dd==2 && j===0)continue;
                // get event name from event type
                name = self._type[type+j] || ( self._type[type+j] = self._getEventName(type, j));
                /*
                event.$xui : called by xui fireEvent
                event.$xuiall : fire all events of the type: before/on/after
                event.$xuitype : fire specific type only
                */
                if(!xuievent || xuiall || (name===xuitype))obj._getEV(funs, id, name, src.$xid);
            }

            /*call function by order
             widget before -> dom before -> widget on -> dom on -> widget after -> dom after
            */
            f=function(a,b){
                for(var i=0,v;v=arguments.callee.tasks[i++];)
                    //if any fun return false, stop event bubble
                    if(false === v(obj, a, b))
                        return false;
                return true;
            };
            f.tasks=funs;
            r = f(event, src.$xid);
            // add a patch for resize
            if(w===src && type=="size"){
                xui.asyRun(function(){
                    f(event, src.$xid);
                    f.tasks.length=0;
                    delete f.tasks;
                    f=src=null;
                },150);
            }
    
            if(dragdrop){
                //shortcut for onDrag('mousemove')
                if(type=='drag')
                    dragdrop._onDrag=f;
                else if(type=='dragover')
                    dragdrop._onDragover=f;
            }else if(type!=="size"){
                f.tasks.length=0;
                delete f.tasks;
                f=null;
            }

            if(dd==1){
                //From parent droppable node to child droppable node, fire parent node's mouseout manually
                if('mouseover'==type && dragdrop._dropElement==src.$xid && pre && pre!=src.$xid){
                    t=xui.use(pre).get(0);
                    self({
                        type: 'mouseout',
                        target: t,
                        $xui:true,
                        $xuitype:'beforeMouseout',
                        preventDefault:function(e){xui.Event.stopDefault(e);},
                        stopPropagation:function(e){xui.Event.stopBubble(e);}
                        },t);
                    dragdrop.setDropElement(src.$xid);
                }

                //Out of droppable node, 'dragdrop._dropElement' will be set to null in beforeMouseover
                //set _preDroppable flag, for parent node is droppable too
                if('mouseout'==type && !dragdrop._dropElement && pre && pre==src.$xid){
                    self._preDroppable=id;
                    xui.asyRun(function(){delete xui.Event._preDroppable});
                }

                //if fire dd, prevent to fire parent dd
                //notice: this dont trigger cursor changing in opera
                if(src.$xid==dragdrop._dropElement)
                    r=false;
            }

            if(r===false)self.stopBubble(event);
            return r;
        }
    },
    Static:{
        $FALSE:xui.browser.opr?undefined:false,
        _type:{},
        _kb:{keydown:1,keypress:1,keyup:1},
        _reg:/(-[\w]+)|([\w]+$)/g,
        $eventhandler:function(){return xui.Event(arguments[0], this)},
        // Reserved
        $eventhandler2:function(){return xui.Event(arguments[0], this,1)},
        $eventhandler3:function(){var a=arguments[0], t=xui.Event.getSrc(a||window.event), r=xui.Event(a, t); if(r===false)return r; else if(t!==this) return xui.Event(a, this)},
        $lastMouseupTime:0,
        $dblcInterval:500,
        $lastClickFunMark:0,
        //collection
        _events : ("mouseover,mouseout,mousedown,mouseup,mousemove,mousewheel,click,dblclick,contextmenu," +
                "keydown,keypress,keyup,scroll,"+
                "blur,focus,"+
                "load,unload,beforeunload,abort,"+
                "change,select,submit,reset,error,"+
                //customized handlers:
                //dont use resize in IE
                "move,size," +
                //dragstart dragdrop dragout will not work in IE(using innerHTML)
                // Use "dragbegin instead of dragstart" to avoid native DnD
                "dragbegin,drag,dragstop,dragleave,dragenter,dragover,drop,"+
                // touch event
                "touchstart,touchmove,touchend,touchcancel,mspointerdown,mspointermove,mspointerup,mspointercancel,pointerdown,pointermove,pointerup,pointercancel")
                .split(','),
        _addEventListener : function(node, evt, fnc) {
            // name: click/onclick/onClick/beforeClick/afterClick
            var getName=function(name){
                return name.replace(/^on|before|after/,'').toLowerCase();
            },
            // name: click/onclick/onClick/beforeClick/afterClick
            getHandler=function(name, force){
                var map={touchstart:1,touchmove:1,touchend:1,touchcancel:1};
                name=getName(name);
                return (force || !map[name]) ? ('on'+name) : name;
            };
            // W3C model
            if (node.addEventListener) {
                node.addEventListener(getName(evt), fnc, false);
                return true;
            } 
            // Microsoft model (ignore attachEvent)
            // reason: [this] is the window object, not the element; 
            //             If use fnc.apply(node, arguments), you can hardly handle detachEvent when you  attachEvent a function for multi nodes, multi times
            //else if (node.attachEvent) {
            //    return node.attachEvent(getHandler(evt),  fnc);
            //}
            // Browser don't support W3C or MSFT model, go on with traditional
            else {
                evt = getHandler(evt,true);
                if(typeof node[evt] === 'function'){
                    // Node already has a function on traditional
                    // Let's wrap it with our own function inside another function
                    fnc = (function(f1,f2){
                        var f = function(){
                            var funs=arguments.callee._funs;
                            for(var i=0,l=funs.length;i<l;i++)
                                funs[i].apply(this,arguments);
                        };
                        f._funs=f1._funs||[f1];
                        f1._funs=null;
                        f._funs.push(f2);
                        return f;
                    })(node[evt], fnc);
                }
                node[evt] = fnc;
                return true;
            }
            return false;
        },
        _removeEventListener : function(node, evt, fnc) {
            // name: click/onclick/onClick/beforeClick/afterClick
            var getName=function(name){
                return name.replace(/^on|before|after/,'').toLowerCase();
            },
            // name: click/onclick/onClick/beforeClick/afterClick
            getHandler=function(name, force){
                var map={touchstart:1,touchmove:1,touchend:1,touchcancel:1};
                name=getName(name);
                return (force || !map[name]) ? ('on'+name) : name;
            };
            // W3C model
            if (node.removeEventListener) {
                node.removeEventListener(getName(evt), fnc, false);
                return true;
            } 
            // Microsoft model (ignore attachEvent)
            // reason: [this] is the window object, not the element; 
            //             If use fnc.apply(node, arguments), you can hardly handle detachEvent when you  attachEvent a function for multi nodes, multi times
            //else if (node.detachEvent) {
            //    return node.detachEvent(getHandler(evt), fnc);
            //}
            // Browser don't support W3C or MSFT model, go on with traditional
            else {
                evt = getHandler(evt,true);
                if(node[evt]  === fnc){
                    node[evt]=null;
                    return true;
                }else if(node[evt] && node[evt]._funs && xui.arr.indexOf(node[evt]._funs, fnc)!=-1){
                    xui.arr.removeValue(node[evt]._funs, fnc);
                    return true;
                }
            }
            return false;
        },
        simulateEvent : function(target, type, options, fromtype) {
            options = options || {};
            if(target[0])target = target[0];
            xui.tryF(xui.Event.$eventsforSimulation[fromtype||type],[target, type, options]);
        },
        _getEventName:function(name,pos){
            return (name=this._map1[name]) && ((pos===0||pos==1||pos==2) ? name[pos] : name);
        },
        _getProfile:function(id,a,b){
            return id && (typeof id=='string') && ((a=(b=xui.$cache.profileMap)[id])
                            ?
                            a['xui.UIProfile']
                                ?
                                a
                                :
                                (b=b[id.replace(this._reg,'')])
                                    ?
                                    b
                                    :
                                    a
                            :
                            b[id.replace(this._reg,'')]);
        },
        _handleTabHook:function(src, target){
            if(src===document)return true;
            var node=src,r,tabindex=node.tabIndex;
            do{
                if(xui.getId(node)==target[0]){
                    node=src=null;
                    return true;
                }
            }while(node && (node=node.parentNode) && node!==document && node!==window)

            r=xui.tryF(target[1],[target[0],tabindex],src);
            node=src=null;
            return false;
        },
        setActions(actions){
            this.actions=actions;
        },
        getActions(){

            return this.actions;
        },
        _handleMouseHover:function(event,target,dd){
            if(target==document){
                target=null;
                return true;
            }
            var node = (event.type=='mouseover'?event.fromElement:event.toElement)||event.relatedTarget;

            //When out of droppable node, if the parent node is droppable return true;
            if(dd && event.type=='mouseover' &&this._preDroppable)
                try{
                    do{
                        if(node && node.id && node.id==this._preDroppable){
                            target=node=null;
                            return true
                        }
                    }while(node && (node=node.parentNode) && node!==document && node!==window)
                }catch(a){}

            //for firefox wearing anynomous div in input/textarea
            //related to 'div.anonymous-div' always returns true
            if(xui.browser.gek)
                try{
                    do{
                        if(node==target){
                            target=node=null;
                            return false
                        }
                    }while(node && (node=node.parentNode))
                }catch(a){
                    var pos=this.getPos(event),
                        node=xui([target]),
                        p=node.offset(),
                        s=node.cssSize(),
                        out=(pos.left<p.left||pos.left>p.left+s.width||pos.top<p.top||pos.top>p.top+s.height);
                    target=node=null;
                    return event.type=='mouseover'?!out:out;
                }
            else
                do{
                    if(node==target){
                        target=node=null;
                        return false
                    }
                }while(node && (node=node.parentNode))
            target=node=null;
            return true;
        },

        _tabHookStack:[],
        pushTabOutTrigger:function(boundary, trigger){this._tabHookStack.push([xui(boundary)._nodes[0], trigger]);return this},
        popTabOutTrigger:function(flag){if(flag)this._tabHookStack=[];else this._tabHookStack.pop();return this},
        getSrc:function(event){
            var a;
            return ((a=event.target||event.srcElement||null) && xui.browser.kde && a.nodeType == 3)?a.parentNode:a
        },
        getId:function(node){
            return window===node?"!window":document===node?"!document":node.id;
        },
        // only for mousedown and mouseup
        // return 1 : left button, else not left button
        getBtn:function(event){
            return xui.browser.ie ?
                    event.button==4 ?
                        'middle' :
                            event.button==2 ?
                                'right' :
                                    'left' :
                    event.which==2 ?
                        'middle':
                            event.which==3 ?
                                'right':
                                    'left';
        },
        getPos:function(event,original){
            event = event || window.event;
            if (!event){
                return  {left:0, top:0};
            }
            if(xui.browser.isTouch && event.changedTouches && event.changedTouches[0])
                event = event.changedTouches[0];

            if(event && ('pageX' in event)){
                var scale=original?1:(xui.ini.$zoomScale||1);
                return {left:event.pageX/scale, top:event.pageY/scale};
            }else{
    			var d=document, doc = d.documentElement, body = d.body,t,
    			_L = (xui.isSet(t=doc && doc.scrollLeft)?t:xui.isSet(t=body && body.scrollLeft)?t:0) - (xui.isSet(t=doc.clientLeft)?t:0),
    			_T = (xui.isSet(t=doc && doc.scrollTop)?t:xui.isSet(t=body && body.scrollTop)?t:0) - (xui.isSet(t=doc.clientTop)?t:0);
                return {left:event.clientX+_L, top:event.clientY+_T};
            }
        },
        /*return array(key, control, shift, alt)
        ['k','1','',''] : 'k' pressed, 'control' pressed, 'shift' and 'alt' not pressed
        */
        /*
        opear in window:
            ' = right (39)
            - = insert (45)
            . = del (46)
        */
        getKey:function(event){
            // for the fake one
            if(event&&event.$xuievent)return event;

            event=event||window.event;
            // use keyCode first for newer safari
            var res=[],t, k= event.$key || event.keyCode || event.charCode || 0;
            //from xui event
            if(typeof k == 'string')
                res[0]=k;
            else{
                var key= String.fromCharCode(k),
                    type=event.type;
                if(
                 //visible char
                 (type=='keypress' && k>=33 && k<=128)
                 //0-9, A-Z
                 ||((k>=48&&k<=57) || (k>=65&&k<=90))
                 )res[0]=key;
                else{
                    if(!(t=arguments.callee.map)){
                        t = arguments.callee.map ={};
                        var k,arr =
                        ("3,enter,8,backspace,9,tab,12,numlock,13,enter,19,pause,20,capslock," +
                        "27,esc,32, ,33,pageup,34,pagedown,35,end,36,home,37,left,38,up,39,right,40,down,44,printscreen," +
                        "45,insert,46,delete,50,down,52,left,54,right,56,up," +
                        "91,win,92,win,93,apps," +
                        "96,0,97,1,98,2,99,3,100,4,101,5,102,6,103,7,104,8,105,9," +
                        "106,*,107,+,109,-,110,.,111,/," +
                        "112,f1,113,f2,114,f3,115,f4,116,f5,117,f6,118,f7,119,f8,120,f9,121,f10,122,f11,123,f12," +
                        "144,numlock,145,scroll," +
                        "186,;,187,=,189,-,190,.,191,/,192,`,"+
                        "219,[,220,\\,221,],222,'," +
                        "224,meta,"+ //Apple Meta and Windows key
                        //safari
                        "63289,numlock,63276,pageup,63277,pagedown,63275,end,63273,home,63234,left,63232,up,63235,right,63233,down,63272,delete,63302,insert,63236,f1,63237,f2,63238,f3,63239,f4,63240,f5,63241,f6,63242,f7,63243,f8,63244,f9,63245,f10,63246,f11,63247,f12,63248,print"
                        ).split(',')
                        for(var i=1,l=arr.length; i<l; i=i+2)
                            t[arr[i-1]]=arr[i]
                        arr.length=0;
                        //add
                        t[188]=',';
                    }
                    res[0]= t[k] || key;
                }
            }

            //control
            if((event.modifiers)?(event.modifiers&Event.CONTROL_MASK):(event.ctrlKey||event.ctrlLeft||k==17||k==57391)){
                if(k==17||k==57391)
                    res[0]='';
                res.push('1');
            }else
                res.push('');

            //shift
            if((event.modifiers)?(event.modifiers&Event.SHIFT_MASK):(event.shiftKey||event.shiftLeft||k==16||k==57390)){
                if(k==16||k==57390)
                    res[0]='';
                res.push('1');
            }else
                res.push('');

            //alt
            if((event.modifiers)?false:(event.altKey||event.altLeft||k==18||k==57388)){
                if(k==18||k==57388)
                    res[0]='';
                res.push('1');
            }else
                res.push('');

            // use keydown char
            res[0]=res[0];
            res.key=res[0];
            res.keyCode=k;
            res.type=type;
            res.ctrlKey=!!res[1];
            res.shiftKey=!!res[2];
            res.altKey=!!res[3];

            if(type=='keypress'){
                if(this.$keydownchar && this.$keydownchar.length>1)
                    res.key=this.$keydownchar;
            }
            // keep the prev keydown char
            else if(type=='keydown'){
                if(res[0].length>1)
                    this.$keydownchar=res[0];
                else if(this.$keydownchar)
                    this.$keydownchar=null;
            }
            // clear it
            else if(type=='keyup'){
                if(this.$keydownchar)
                    this.$keydownchar=null;
            }

            return res;
        },
        getEventPara:function(event, mousePos){
            if(!mousePos)mousePos=xui.Event.getPos(event);
            var keys = this.getKey(event), 
            button=this.getBtn(event), 
            h={
                button:button,
                pageX:mousePos&&mousePos.left,
                pageY:mousePos&&mousePos.top,
                key:keys.key,
                keyCode:keys.keyCode,
                ctrlKey:keys.ctrlKey,
                shiftKey:keys.shiftKey,
                altKey:keys.altKey,
                $xuieventpara:true
            };
            for(var i in event)if(i.charAt(0)=='$')h[i]=event[i];
            return h;
        },
        stopBubble:function(event){
            event=event||window.event;
            if(event.stopPropagation)event.stopPropagation();
            if("cancelBubble" in event)event.cancelBubble = true;
            this.stopDefault(event);
        },
        stopDefault:function(event){
            event=event||window.event;
            if(event.preventDefault)event.preventDefault();
            else if("returnValue" in event)event.returnValue = false;
        },
        _kbh:function(cache, key, ctrl, shift, alt, fun, id, args, scope, base){
            if(key){
                id = id || ((typeof fun=='string') ? fun :null);
                key = (key||'').toLowerCase() + ":"  + (ctrl?'1':'') + ":"  +(shift?'1':'')+ ":" + (alt?'1':'');
                cache[key] = cache[key]||[];
                if(typeof fun=='function'){
                    // remove previous attach
                    // try 1
                    if(id){
                        delete cache[key][id];
                        xui.arr.removeValue(cache[key], id);
                    }else id=xui.rand();

                    cache[key][id]=[fun,args,scope,base]
                    cache[key].push( id );
                    return id;
                }else{
                    if(id){
                        delete cache[key][id];
                        xui.arr.removeValue(cache[key], id);
                    }else
                        delete cache[key];
                }
            }
            return this;
        },
        //key:control:shift:alt
        keyboardHook:function(key, ctrl, shift, alt, fun, id, args, scope, base){
            return this. _kbh(xui.$cache.hookKey, key, ctrl, shift, alt, fun, id, args, scope, base);
        },
        keyboardHookUp:function(key, ctrl, shift, alt, fun, id, args,scope, base){
            return this. _kbh(xui.$cache.hookKeyUp, key, ctrl, shift, alt, fun, id, args, scope, base);
        },
        getWheelDelta:function(e){
            return e.wheelDelta
            // ie/opr/kde
            ?e.wheelDelta/120
            // gek
            :-e.detail/3
        },
        $TAGNAMES:{
          'select':'input','change':'input',  
          'submit':'form','reset':'form',  
          'error':'img','load':'img','abort':'img'  
        },
        _supportCache:{},
        isSupported:function(name, node) {
            var ns=this,c=ns._supportCache,rn=(node?node.tagName.toLowerCase():"div")+":"+name;
            if(rn in c)return c[rn];
            node = node || document.createElement(ns.$TAGNAMES[name] || 'div');
            name = 'on' + name;
            // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
            var isSupported = (name in node);
            if (!isSupported) {
              // if it has no `setAttribute` (i.e. doesn't implement Node interface), try generic node
              if(!node.setAttribute)node = document.createElement('div');
                if(node.setAttribute) {
                  node.setAttribute(name, '');
                  isSupported = typeof node[name] == 'function';
                  if (typeof node[name] != 'undefined')node[name] = undefined;
                  node.removeAttribute(name);
                }
            }
            node = null;
            return c[rn]=isSupported;
        },
        _simulateMousedown:function(event){
            if(!event.touches)return true;
            var E=xui.Event,
                touches = event.changedTouches, 
                first = touches[0];
            if(event.touches.length>1)return true;

            E.__simulatedMousedownNode=first.target;

            if(!E.isSupported("mousedown")){
                E.simulateEvent(first.target,"mousedown",{screenX:first.screenX, screenY:first.screenY, clientX:first.clientX, clientY:first.clientY});
            }else{
                // use custom event to avoid affecting system or 3rd lib
                // it will fire xui beforeMousedown event group only
                // Needs delay to allow the browser to determine if the user is performing another gesture (etc. double-tap zooming)
                E._xuitouchdowntime=xui.setTimeout(function(){
                    E._xuitouchdowntime=0;
                    E.simulateEvent(first.target,"xuitouchdown",{screenX:first.screenX, screenY:first.screenY, clientX:first.clientX, clientY:first.clientY},'mousedown');
                },100);
            }
            
            return true;
        },
        _simulateMouseup:function(event){
            if(!event.touches)return true;
            var E=xui.Event,
                _now=(new Date).getTime(),
                interval=_now-E.$lastMouseupTime,
                touches = event.changedTouches, first = touches[0];
            if(E._xuitouchdowntime){
                xui.clearTimeout(E._xuitouchdowntime);
            }
            E.__simulatedMouseupNode=first.target;
            if(!E.isSupported("mouseup")){
                E.simulateEvent(first.target,"mouseup",{screenX:first.screenX, screenY:first.screenY, clientX:first.clientX, clientY:first.clientY});
            }

            // click and dblclick
            if(E.__simulatedMouseupNode===E.__simulatedMousedownNode){
                if(!E.isSupported("click")){
                    E.simulateEvent(first.target,"click",{screenX:first.screenX, screenY:first.screenY, clientX:first.clientX, clientY:first.clientY});
                }
                // doubleclick for touch event
                if(interval<=E.$dblcInterval){
                    xui.asyRun(function(){
                        // disalbe next one
                        E.$lastMouseupTime=0;
                        E.simulateEvent(first.target,"dblclick",{screenX:first.screenX, screenY:first.screenY, clientX:first.clientX, clientY:first.clientY});
                    });
                }
            }
            E.__simulatedMouseupNode=E.__simulatedMousedownNode=null;
            E.$lastMouseupTime=_now;

            return true;
        },
        stopPageTouchmove:function(){
            xui.Event._addEventListener(document,
                (xui.browser.ie&&xui.browser.ver>=11)?"pointermove":
                (xui.browser.ie&&xui.browser.ver>=10)?"MSPointerMove":
                'touchmove', xui.Event.stopDefault
            );
        },
        allowPageTouchmove:function(){
            xui.Event._removeEventListener(document,
                (xui.browser.ie&&xui.browser.ver>=11)?"pointermove":
                (xui.browser.ie&&xui.browser.ver>=10)?"MSPointerMove":
                'touchmove', xui.Event.stopDefault
            );
        }
    },
    Initialize:function(){
        var ns=this,
        w=window,
        d=document,
        m1={
            move:null,
            size:null,

            drag:null,
            dragstop:null,
            dragover:null,

            mousewheel:null,

            dragbegin:'onmousedown',
            dragenter:'onmouseover',
            dragleave:'onmouseout',
            drop:'onmouseup'
        },
        a1=['before','on','after'],
        t1,t2,s;
        
        t1=ns._map1={};
        xui.arr.each(ns._events,function(o){
            s=xui.str.initial(o);
            t1[o]=[a1[0]+s, a1[1]+s, a1[2]+s];
        });
        
        t1=ns._eventMap={};
        t2=ns._eventHandler={};
        xui.arr.each(ns._events,function(o){
            s=xui.str.initial(o);
            t1[o]=t1[a1[1]+o]=t1[a1[0]+s]=t1[a1[1]+s]=t1[a1[2]+s]= o;
            t2[o]=t2[a1[1]+o]=t2[a1[0]+s]=t2[a1[1]+s]=t2[a1[2]+s]= (o in m1)?m1[o]:('on'+o);
        });
        
        //add the root resize handler
        ns._addEventListener(w, "resize", ns.$eventhandler);
        
        // DOMMouseScroll is for firefox only
        ns._addEventListener(w, "DOMMouseScroll", ns.$eventhandler3);

        // for simulation dblclick event in touchable device
        if(xui.browser.isTouch){
            ns._addEventListener(d, 
                    (xui.browser.ie&&xui.browser.ver>=11)?"pointerdown":
                    (xui.browser.ie&&xui.browser.ver>=10)?"MSPointerDown":
                    "touchstart", ns._simulateMousedown);
            ns._addEventListener(d, 
                    (xui.browser.ie&&xui.browser.ver>=11)?"pointerup":
                    (xui.browser.ie&&xui.browser.ver>=10)?"MSPointerUp":
                    "touchend", ns._simulateMouseup);
            ns._addEventListener(d,  "xuitouchdown", ns.$eventhandler);
        }

        // for simulation
        ns._addEventListener(w, "mousewheel", ns.$eventhandler3);
        // window enough
        // ns._addEventListener(d, "mousewheel", ns.$eventhandler3);

        var keyEvent=function(target, type , options){
            switch(type) {
                case "textevent":
                    type = "keypress"
                    break
                case "keyup":
                case "keydown":
                case "keypress":
                    break;
            }
           xui.merge(options,{
                bubbles :true,
                cancelable:true,
                view:w,
                ctrlKey:false,
                altKey:false,
                shiftKey:false,
                metaKey:false,
                keyCode : 0,
                charCode : 0
            },'without');
            var bubbles=options.bubbles,
                cancelable=options.cancelable,
                view=options.view,
                ctrlKey=options.ctrlKey,
                altKey=options.altKey,
                shiftKey=options.shiftKey,
                metaKey=options.metaKey,
                keyCode=options.keyCode,
                charCode=options.charCode;

            var customEvent = null;
            if (d.createEvent){    
                try {
                    customEvent = d.createEvent("KeyEvents");
                    // TODO: special decipher in Firefox
                    customEvent.initKeyEvent(type, bubbles, cancelable, view, ctrlKey,altKey, shiftKey, metaKey, keyCode, charCode);
                } catch (ex) {
                    try {
                        customEvent = d.createEvent("Events");    
                    } catch (uierror) {
                        customEvent = d.createEvent("UIEvents");    
                    } finally {
                        customEvent.initEvent(type, bubbles, cancelable);
                        customEvent.view = view;
                        customEvent.altKey = altKey;
                        customEvent.ctrlKey = ctrlKey;
                        customEvent.shiftKey = shiftKey;
                        customEvent.metaKey = metaKey;
                        customEvent.keyCode = keyCode;
                        customEvent.charCode = charCode;    
                    }
                }
                target.dispatchEvent(customEvent);    
                
            } 
            // for IE
            else if(d.createEventObject) {
                customEvent = d.createEventObject();
    
                customEvent.bubbles = bubbles;
                customEvent.cancelable = cancelable;
                customEvent.view = view;
                customEvent.ctrlKey = ctrlKey;
                customEvent.altKey = altKey;
                customEvent.shiftKey = shiftKey;
                customEvent.metaKey = metaKey;
        
    
                customEvent.keyCode = (charCode > 0) ? charCode : keyCode;
        
                target.fireEvent("on" + type, customEvent);
            } else {
                throw type + ' cant be simulated in ' + navigator.userAgent;
            }
        },
        mouseEvent=function(target, type , options){
           options=options||{};
           xui.merge(options,{
                bubbles :true,
                cancelable:true,
                view:w,
                detail:1,
                ctrlKey:false,
                altKey:false,
                shiftKey:false,
                metaKey:false,
                screenX:0,
                screenY:0,
                clientX:0,
                clientY:0,
                button:0,
                relatedTarget: null
            },'without');
            var bubbles=options.bubbles,
                cancelable=options.cancelable,
                view=options.view,
                detail=options.detail,
                ctrlKey=options.ctrlKey,
                altKey=options.altKey,
                shiftKey=options.shiftKey,
                metaKey=options.metaKey,
                screenX=options.screenX,
                screenY=options.screenY,
                clientX=options.clientX,
                clientY=options.clientY,
                button=options.button,
                relatedTarget=options.relatedTarget;
        
            var customEvent = null;    
            if (d.createEvent){    
                customEvent = d.createEvent("MouseEvents");
                
                if (customEvent.initMouseEvent){
                    customEvent.initMouseEvent(type, bubbles, cancelable, view, detail,
                                         screenX, screenY, clientX, clientY,
                                         ctrlKey, altKey, shiftKey, metaKey,
                                         button, relatedTarget);
                }
                // Safari 2.x doesn't support initMouseEvent
                else {
                    customEvent = d.createEvent("UIEvents");
                    customEvent.initEvent(type, bubbles, cancelable);
                    customEvent.view = view;
                    customEvent.detail = detail;
                    customEvent.screenX = screenX;
                    customEvent.screenY = screenY;
                    customEvent.clientX = clientX;
                    customEvent.clientY = clientY;
                    customEvent.ctrlKey = ctrlKey;
                    customEvent.altKey = altKey;
                    customEvent.metaKey = metaKey;
                    customEvent.shiftKey = shiftKey;
                    customEvent.button = button;
                    customEvent.relatedTarget = relatedTarget;
                }
    
                if (relatedTarget && !customEvent.relatedTarget) {
                    if (type === "mouseout") {
                        customEvent.toElement = relatedTarget;
                    } else if (type === "mouseover") {
                        customEvent.fromElement = relatedTarget;
                    }
                }
                target.dispatchEvent(customEvent);
            }
            //IE
            else if(d.createEventObject){
                customEvent = d.createEventObject();
        
                customEvent.bubbles = bubbles;
                customEvent.cancelable = cancelable;
                customEvent.view = view;
                customEvent.detail = detail;
                customEvent.screenX = screenX;
                customEvent.screenY = screenY;
                customEvent.clientX = clientX;
                customEvent.clientY = clientY;
                customEvent.ctrlKey = ctrlKey;
                customEvent.altKey = altKey;
                customEvent.metaKey = metaKey;
                customEvent.shiftKey = shiftKey;
        
                switch(button) {
                    case 0:
                        customEvent.button = 1;
                        break;
                    case 1:
                        customEvent.button = 4;
                        break;
                    case 2:
                        //leave as is
                        break;
                    default:
                        customEvent.button = 0;
                }
        
                customEvent.relatedTarget = relatedTarget;
        
                target.fireEvent("on" + type, customEvent);    
            } else {
                throw type + ' cant be simulated in ' + navigator.userAgent;
            }
        },
        UIEvent=function(target, type , options){    
           xui.merge(options,{
                bubbles : true,
                cancelable:(type === "submit"),
                view:w,
                detail:1
            },'without');
            var bubbles=options.bubbles,
                cancelable=options.cancelable,
                view=options.view,
                detail=options.detail;
    
            var customEvent = null;
            if (d.createEvent){    
                customEvent = d.createEvent("UIEvents");
                customEvent.initUIEvent(type, bubbles, cancelable, view, detail);
                target.dispatchEvent(customEvent);    
            }
            //IE
            else if(d.createEventObject){ 
                customEvent = d.createEventObject();
                customEvent.bubbles = bubbles;
                customEvent.cancelable = cancelable;
                customEvent.view = view;
                customEvent.detail = detail;
    
                target.fireEvent("on" + type, customEvent);    
            } else {
                throw type + ' cant be simulated in ' + navigator.userAgent;
            }
        },
        // for ios v2.0+
        gestureEvent=function(target, type , options){
           xui.merge(options,{
                bubbles :true,
                cancelable:true,
                detail:2,
                view:w,
                ctrlKey:false,
                altKey:false,
                shiftKey:false,
                metaKey:false,
                scale : 1.0,
                rotation : 0.0
            },'without');
            var bubbles=options.bubbles,
                cancelable=options.cancelable,
                detail=options.detail,
                view=options.view,
                ctrlKey=options.ctrlKey,
                altKey=options.altKey,
                shiftKey=options.shiftKey,
                metaKey=options.metaKey,
                scale=options.scale,
                rotation=options.rotation;
        
            var customEvent;
            customEvent = d.createEvent("GestureEvent");
            customEvent.initGestureEvent(type, bubbles, cancelable, view, detail,
                screenX, screenY, clientX, clientY,
                ctrlKey, altKey, shiftKey, metaKey,
                target, scale, rotation);
            target.dispatchEvent(customEvent);
        },
        touchEvent=function(target, type , options){
            if (type === 'touchstart' || type === 'touchmove') {
                if (!options.touches || !options.touches.length) {
                    throw 'No touch object in touches.';
                }
            } else if (type === 'touchend') {
                if (!options.changedTouches || !options.changedTouches.length) {
                    throw 'No touch object in changedTouches.';
                }
            }
           xui.merge(options,{
                bubbles :true,
                cancelable:(type !== "touchcancel"),
                detail:1,
                view:w,
                ctrlKey:false,
                altKey:false,
                shiftKey:false,
                metaKey:false,
                screenX:0,
                screenY:0,
                clientX:0,
                clientY:0,
                scale : 1.0,
                rotation : 0.0
            },'without');
            var bubbles=options.bubbles,
                cancelable=options.cancelable,
                detail=options.detail,
                view=options.view,
                scale=options.scale,
                rotation=options.rotation,
                touches=options.touches,
                targetTouches=options.targetTouches,
                changedTouches=options.changedTouches,
                ctrlKey=options.ctrlKey,
                altKey=options.altKey,
                shiftKey=options.shiftKey,
                metaKey=options.metaKey,
                screenX=options.screenX,
                screenY=options.screenY,
                clientX=options.clientX,
                clientY=options.clientY,
                cancelable = type=="touchcancel"? false : options.cancelable;
            var customEvent;
            if (d.createEvent){
                if (xui.browser.isAndroid) {
                    if (xui.browser.ver < 4.0) {
                        customEvent = d.createEvent("MouseEvents");
                        customEvent.initMouseEvent(type, bubbles, cancelable, view, detail, 
                            screenX, screenY, clientX, clientY,
                            ctrlKey, altKey, shiftKey, metaKey,
                            0, target);
                        customEvent.touches = touches;
                        customEvent.targetTouches = targetTouches;
                        customEvent.changedTouches = changedTouches;
                    } else {
                        customEvent = d.createEvent("TouchEvent");
                        // Andoroid isn't compliant W3C initTouchEvent
                        customEvent.initTouchEvent(touches, targetTouches, changedTouches,
                            type, view,
                            screenX, screenY, clientX, clientY,
                            ctrlKey, altKey, shiftKey, metaKey);
                    }
                } else if (xui.browser.isIOS) {
                    if (xui.browser.ver >= 2.0) {
                        customEvent = d.createEvent("TouchEvent");
                        customEvent.initTouchEvent(type, bubbles, cancelable, view, detail,
                            screenX, screenY, clientX, clientY,
                            ctrlKey, altKey, shiftKey, metaKey,
                            touches, targetTouches, changedTouches,
                            scale, rotation);
                    } else {
                        throw type + ' cant be simulated in ' + navigator.userAgent;
                    }
                } else {
                    throw type + ' cant be simulated in ' + navigator.userAgent;
                }
                target.dispatchEvent(customEvent);
            } else {
                throw type + ' cant be simulated in ' + navigator.userAgent;
            }
        };
        ns.$eventsforSimulation={
            click: mouseEvent,
            dblclick: mouseEvent,
            mouseover: mouseEvent,
            mouseout: mouseEvent,
            mouseenter: mouseEvent,
            mouseleave: mouseEvent,
            mousedown: mouseEvent,
            mouseup: mouseEvent,
            mousemove: mouseEvent,
            pointerover:  mouseEvent,
            pointerout:   mouseEvent,
            pointerdown:  mouseEvent,
            pointerup:    mouseEvent,
            pointermove:  mouseEvent,
            MSPointerOver:  mouseEvent,
            MSPointerOut:   mouseEvent,
            MSPointerDown:  mouseEvent,
            MSPointerUp:    mouseEvent,
            MSPointerMove:  mouseEvent,
            
            keydown: keyEvent,
            keyup: keyEvent,
            keypress: keyEvent,
            
            submit: UIEvent,
            blur: UIEvent,
            change: UIEvent,
            focus: UIEvent,
            resize: UIEvent,
            scroll: UIEvent,
            select: UIEvent,
            
            touchstart: touchEvent,
            touchmove: touchEvent,
            touchend: touchEvent,
            touchcancel: touchEvent,
            
            gesturestart: gestureEvent,
            gesturechange: gestureEvent,
            gestureend: gestureEvent
        };
    }
});xui.Class("xui.CSS", null,{
    Static:{
        _r:xui.browser.ie?'rules':'cssRules',
        _baseid:'xui:css:base',
        _firstid:'xui:css:first',
        _lastid:'xui:css:last',
        _reg1:/\.(\w+)\[CLASS~="\1"\]/g,
        _reg2:/\[ID"([^"]+)"\]/g,
        _reg3:/\*([.#])/g,
        _reg4:/\s+/g,
        _reg5:/\*\|/g,
        _reg6:/(\s*,\s*)/g,
        _rep:function(str){
            var ns=this;
            return str.replace(ns._reg1,'.$1')
                     .replace(ns._reg2,'#$1')
                     .replace(ns._reg3,'$1')
                     .replace(ns._reg4,' ')
                     .replace(ns._reg5,'')
                     .replace(ns._reg6,',').toLowerCase();
        },
        _appendSS:function(container,txt, id, before, attr){
            var fc=document.createElement('style');
            fc.type="text/css";
            if(id)fc.id=id;
            if(xui.browser.ie && fc.styleSheet && "cssText" in fc.styleSheet)
                fc.styleSheet.cssText = txt||'';
            else
                try{fc.appendChild(document.createTextNode(txt||''))}catch(p){fc.styleSheet.cssText = txt||''}
            if(attr){
                xui(fc).attr(attr);
            }
            if(before) xui(container).prepend(fc);
            else xui(container).append(fc);
            return fc;
        },
        _createCss:function(id, txt,last){
            var ns=this,
                head=this._getHead(),
                fid=ns._firstid,
                lid=ns._lastid,
                fc,
                c;
            fc=document.createElement('style');
            fc.type="text/css";
            fc.id=id;
            if(txt){

                if(xui.browser.ie && fc.styleSheet && "cssText" in fc.styleSheet)
                    fc.styleSheet.cssText = txt||'';
                else
                    try{fc.appendChild(document.createTextNode(txt||''))}catch(p){fc.styleSheet.cssText = txt||''}
            }
            if(!last){
                c= document.getElementById(fid) || head.firstChild;
                while((c=c.nextSibling) && !/^(script|link|style)$/i.test(''+c.tagName));
                if(c)
                    head.insertBefore(fc, c);
                else{
                    if(c= document.getElementById(lid))
                        head.insertBefore(fc, c);
                    else
                        head.appendChild(fc);
                }
            }else
                head.appendChild(fc);
            return fc;
        },
        _getCss:function(id, css, last){
            return document.getElementById(id) || this._createCss(id, css, last);
        },
        _getBase:function(){
            return this._getCss(this._baseid);
        },
        _getFirst:function(){
            return this._getCss(this._firstid);
        },
        _getLast:function(){
            return this._getCss(this._lastid, null, true);
        },
        _getHead:function(){
            return this._head || (this._head=document.getElementsByTagName("head")[0]||document.documentElement);
        },
        _check:function(){
            if(!xui.browser.ie)return;
            var count=0;
            for(var head = this._getHead(),i=0,t=head.childNodes,l;l=t[i++];)
                if(l.type=="text/css" )
                    count++
            return count>20;
        },
        get:function(property, value){
            for(var head = this._getHead(),i=0,t=head.childNodes,l;l=t[i++];)
                if(l.type=="text/css" && property in l && l[property]==value)
                    return l;
        },
        //if backOf==true, add to head last node
        //else add to the before position of the base styleSheet
        addStyleSheet:function(txt, id, backOf, force){
            var e, ns=this, head = ns._getHead(),
            add=function(txt,id,backOf){
                var e = document.createElement('style');
                e.type="text/css";
                if(id)e.id=id;
                //for ie
                if(xui.browser.ie && e.styleSheet && "cssText" in e.styleSheet)
                    e.styleSheet.cssText = txt||'';
                else
                    try{e.appendChild(document.createTextNode(txt||''))}catch(p){e.styleSheet.cssText = txt||''}
                if(backOf===-1){
                    if(head.firstChild) head.insertBefore(e, head.firstChild); 
                    else head.appendChild(e);
                }else if(backOf===1){
                    head.appendChild(e);
                }else{
                    head.insertBefore(e, backOf?ns._getLast():ns._getBase());
                }
                e.disabled=true;
                e.disabled=false;
                return e;
            },merge=function(txt,backOf){
                var e=backOf ?ns._getLast():ns._getBase();
                e.styleSheet.cssText +=txt;
                return e;
            };
            if(id && (id=id.replace(/[^\w\-\_\.\:]/g,'_')) && (e=ns.get('id',id))){
                if(force){
                    e.disabled=true;
                    head.removeChild(e);
                }
                else return e;
            }

            if(ns._check()){
                return merge(txt, backOf);
            }else
                return add(txt,id,backOf);
        },
        //if front==true, add to the before position of the base styleSheet
        //else add to the last postion
        includeLink:function(href, id, front, attr){
            var e, ns=this, head = ns._getHead();
            if(href && (e=ns.get('href',href))){}else{
                e = document.createElement('link');
                e.type = 'text/css';
                e.rel = 'stylesheet';
                e.href = href;
                if(id)
                    e.id=id;
                e.media = 'all';
                xui.each(attr,function(o,i){
                    e.setAttribute(i,o);
                });
            }
            head.insertBefore(e, front?ns._getBase():ns._getLast());
            e.disabled=true;
            e.disabled=false;
            return e;
        },
        remove:function(property,value){
            var head = this._getHead();
            if(value=this.get(property,value)){
                value.disabled=true;
                head.removeChild(value);
            }
        },
        replaceLink:function(href, property, oValue, nValue){
            var ns=this,
                head=ns._getHead(),
                attr={},e,v;
            attr[property]=nValue;
            e=ns.includeLink(href,null,false,attr);
            if(v=ns.get(property,oValue))
                head.replaceChild(e,v);
            e.disabled=true;
            e.disabled=false;
        },
        _build:function(selector, value, flag){
            var t='';
            xui.each(value,function(o,i){
                t += i.replace(/([A-Z])/g,"-$1").toLowerCase() + ":" + o +";";
            });
            return flag?t:selector+"{" + t + "}";
        },
        //selector: single css exp without ','; not allow '.a, .b{}'
        //  for *** IE *** allow single css exp only
        setStyleRules:function(selector, value, force){
            var ns=this,
                add=true,
                ds=document.styleSheets,
                target, target2, selectorText, bak, h, e, t, _t;
            selector = xui.str.trim(selector.replace(/\s+/g,' '));
            if(!(value&&force)){
                bak=selector.toLowerCase();
                xui.arr.each(xui.toArr(ds),function(o){
                    try{o[ns._r]}catch(e){return}
                    xui.arr.each(xui.toArr(o[ns._r]),function(v,i){
                        if(!v.selectorText)return;
                        if(v.disabled)return;
                        selectorText = ns._rep(v.selectorText);
                        /*Notice: in IE, no ',' in any selectorTExt*/
                        _t=selectorText.split(',');
                        //null=>remove
                        if(!value){
                            add=false;
                            if(xui.arr.indexOf(_t,bak)!=-1 && _t.length>1){
                                _t=xui.arr.removeFrom(_t,xui.arr.indexOf(_t,bak)).join(',');
                                t=v.cssText.slice(v.cssText.indexOf("{")+1,v.cssText.lastIndexOf("}"));
                                if(o.insertRule)
                                    o.insertRule(_t+"{" + t + "}", o[ns._r].length);
                                else if(o.addRule )
                                    o.addRule(_t, t||"{}");
                                if(o.deleteRule)
                                    o.deleteRule(i);
                                else
                                    o.removeRule(i);
                                o.disabled=true;
                                o.disabled=false;
                            }else if(selectorText == bak){
                                if(o.deleteRule)
                                    o.deleteRule(i);
                                else
                                    o.removeRule(i);
                                o.disabled=true;
                                o.disabled=false;
                            }
                        //modify the last one
                        }else{
                            //for single css exp, (all single css exp in IE)
                            if(selectorText==bak){target=v;return false}
                            //for multi css exps, not in IE
                            if(xui.arr.indexOf(_t,bak)!=-1){target2=v;return false}
                        }
                    },null,true);
                    if(target){
                        add=false;
                        try{
                            xui.each(value,function(o,i){
                                i=i.replace(/(-[a-z])/gi, function(m,a){return a.charAt(1).toUpperCase()});
                                target.style[i]= typeof o=='function'?o(target.style[i]):o;
                            })
                        }catch(e){}
                        o.disabled=true;
                        o.disabled=false;
                        return false;
                    //not in IE
                    }else if(target2){
                        add=false;
                        o.insertRule(ns._build(selector,value), o[ns._r].length);
                        o.disabled=true;
                        o.disabled=false;
                        return false;
                    }
                },null,true);
            }
            //need to add
            if(force || add)
                ns._addRules(selector,value);
            return ns;
        },
        $getCSSValue:function(selector, cssKey, cssValue, ownerNode){
            var ns=this,
                k=ns._r, css,
                ds=document.styleSheets,
                l=ds.length,m, o,v,i,j,
                selectorText;
            selector=xui.str.trim(selector.replace(/\s+/g,' ').toLowerCase());
            for(i=l-1; i>=0; i--){
                try{
                    //firefox cracker
                    o=ds[i][k];
                }catch(e){continue;}
                if(!ds[i].disabled){
                    o=ds[i][k];
                    if(o){
                        m=o.length;
                        for(j=m-1; j>=0; j--){
                            if((v=o[j]).selectorText && !v.disabled){
                                selectorText = ns._rep(v.selectorText);
                                if(xui.arr.indexOf(selectorText.split(/\s*,\s*/g),selector)!=-1){
                                    if(!cssKey){
                                        (css=css||[]).push(v);
                                    }else{
                                        if(!cssValue){
                                            if(!ownerNode || (ownerNode==ds[i].ownerNode||ds[i].owningElement))
                                                if(v.style[cssKey]!=='')
                                                    // return cssValue
                                                    // replace is crack for opera
                                                    return (v.style[cssKey]||"").replace(/^\"|\"$/g,'');
                                        }else if(cssValue===v.style[cssKey]){
                                            // return css dom node
                                            return ds[i].ownerNode||ds[i].owningElement ;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // return all stylesheets named cssKey
            return css;
        },
        _addRules:function(selector,value){
            var ns=this,
                target=ns._getLast(),
                changed=target.sheet || target.styleSheet;
            if(changed.insertRule)
                changed.insertRule(ns._build(selector,value), changed[ns._r].length);
            else if(changed.addRule )
                changed.addRule(selector, ns._build(selector,value,true)||"{}");
            target.disabled=true;
            target.disabled=false;
            return ns;
        },
        /*resetCSS:function(){
            var css = '';
            this.addStyleSheet(css,"xui.CSSreset");
        },*/
        adjustFont:function(fontSize, fontFamily, fontWeight, fontStyle){
            if(fontSize)xui('html').css('font-size', fontSize);
            if(fontFamily)xui('html').css('font-family', fontFamily);
            if(fontWeight)xui('html').css('font-weight', fontWeight);
            if(fontStyle)xui('html').css('font-style', fontStyle);

            this._dftEmStr='';
            this._getDftEmSize(true);
            this._dftRemStr='';
            this._getDftRemSize(true);
            if(xui.UI)
                xui.UI.getAll().reLayout(true);
        },
        _dftEmStr:'',
        _dftEm:0,
        _getDftEmSize: function(force){
            var ns=this;
            if(force || !ns._dftEm){
                var fz=ns.$getCSSValue('.xui-ui-ctrl','fontSize'),num;

                // only can be triggerred by modifing font-size of '.xui-ui-ctrl' itslef.
                if(!ns._dftEmStr || ns._dftEmStr!=fz){
                    num=parseFloat(fz);
                    if(num && ns.$isPx(fz)){
                        ns._dftEm=num;

                        ns._dftEmStr=fz;
                    }else if(num && ns.$isRem(fz)){
                        ns._dftEm=num*ns._getDftRemSize();

                        ns._dftEmStr=fz;
                    }else{
                        var div;
                        xui('body').append(div=xui.create('<div class="xui-ui-ctrl" style="height:1em;visibility:hidden;position:absolute;border:0;margin:0;padding:0;left:-10000px;"></div>'));
                        ns._dftEm=div.get(0).offsetHeight;
                        div.remove();

                        ns._dftEmStr=ns._dftEm+"px";
                    }
                }
            }
            return ns._dftEm;
        },
        $resetEm:function(){
            delete xui.CSS._dftEm;
        },
        _dftRemStr:'',
        _dftRem:0,
        _getDftRemSize: function(force){
            var ns=this;
            if(force || !ns._dftRem)
                ns._dftRem=parseFloat(xui('html').css('font-size'))||16;
            return ns._dftRem;
        },
        $resetRem:function(){
            delete xui.CSS._dftRem;
        },
        $isEm:function(value){
            return (!value||value=='auto')? xui.$us()==1 : /^-?((\d\d*\.\d*)|(^\d\d*)|(^\.\d\d*))em$/i.test(xui.str.trim(value+''));
        },
        $isRem:function(value){
            return (!value||value=='auto')? xui.$us()==1 : /^-?((\d\d*\.\d*)|(^\d\d*)|(^\.\d\d*))rem$/i.test(xui.str.trim(value+''));
        },
        $isPx:function(value){
            return (!value||value=='auto')? xui.$us()==1  : /^-?((\d\d*\.\d*)|(^\d\d*)|(^\.\d\d*))px$/i.test(xui.str.trim(value+''));
        },

        $em2px:function(value, node, roundPx){
            value = (!value||value=='auto')?value:(xui.isFinite(value) || this.$isEm(value)) ? (parseFloat(value)||0) * (node?xui.isFun(node)?node():xui.isFinite(node)?node:xui(node)._getEmSize():this._getDftEmSize()||this._getDftEmSize()) : value;
            return roundPx?Math.round(parseFloat(value)||0):value;
        },
        $px2em:function(value, node, roundPx){
            return (!value||value=='auto')?value:(xui.isFinite(value) || this.$isPx(value)) ?  (roundPx?Math.round(parseFloat(value)||0):(parseFloat(value)||0)) / (node?xui.isFun(node)?node():xui.isFinite(node)?node:xui(node)._getEmSize():this._getDftEmSize()||this._getDftEmSize()): value;
        },
        $rem2px:function(value, roundPx){
            value = (!value||value=='auto')?value:(xui.isFinite(value) || this.$isRem(value)) ? (parseFloat(value)||0) * this._getDftRemSize() : value;
            return roundPx?Math.round(parseFloat(value)||0):value;
        },
        $px2rem:function(value, roundPx){
            return (!value||value=='auto')?value:(xui.isFinite(value) || this.$isPx(value)) ?  (roundPx?Math.round(parseFloat(value)||0):(parseFloat(value)||0)) / this._getDftRemSize(): value;
        },
        $em2rem:function(value, node){
            return (!value||value=='auto') ? value : (xui.isFinite(value) || this.$isEm(value)) ? (parseFloat(value)||0)  * (node?xui.isFinite(node)?node:xui(node)._getEmSize():this._getDftEmSize()||this._getDftEmSize()) / this._getDftRemSize() : value;
        },
        $rem2em:function(value, node){
            return (!value||value=='auto') ? value : (xui.isFinite(value) || this.$isRem(value)) ? (parseFloat(value)||0)  * this._getDftRemSize() / (node?xui.isFinite(node)?node:xui(node)._getEmSize():this._getDftEmSize()||this._getDftEmSize()) : value;
        },
        $px:function(value, node, roundPx){
            value = ((!xui.isFinite(value)&&this.$isRem(value))?this.$rem2px(value,roundPx):this.$isEm(value)?this.$em2px(value, node, roundPx):(!value||value=='auto')?value:(parseFloat(value)||0));
            return roundPx?Math.round(parseFloat(value)||0):value;
        },
        $em:function(value, node, roundPx){
            return ((xui.isFinite(value)||this.$isPx(value))?this.$px2em(value, node,roundPx):this.$isRem(value)?this.$rem2em(value, node):(!value||value=='auto')?value:(parseFloat(value)||0));
        },
        $rem:function(value, node, roundPx){
            return ((xui.isFinite(value)||this.$isPx(value))?this.$px2rem(value,roundPx):this.$isEm(value)?this.$em2rem(value,node):(!value||value=='auto')?value:(parseFloat(value)||0));
        },
        $addpx:function(a,b,node){
            if(a=='auto')return a;
            if(this.$isRem(a)){
                return this.$px2rem(Math.round(this.$rem2px(a)+(parseFloat(b)||0)))+'rem';
            }else if(this.$isEm(a)){
                return this.$px2em(Math.round(this.$em2px(a,false,node)+(parseFloat(b)||0)))+'em';
            }else{
                return Math.round((parseFloat(a)||0)+(parseFloat(b)||0))+'px';
            }
        },
        $forceu:function(v,u,node,roundPx){
            return (v===null||v===undefined||v===''||v=='auto') ? v:
                ( u ? u=='rem' : (xui.$us()===0)) ? this.$rem(v,node,roundPx!==false)+'rem':
                ( u ? u=='em' : (xui.$us()==1)) ? this.$em(v,node,roundPx!==false)+'em':
                Math.round(this.$px(v,node,roundPx!==false))+'px'
        },
       
        $picku:function(v){return v && v!='auto' && (v+'').replace(/[-\d\s.]*/g,'') || (xui.$us()==1?'em':'px')},
        $addu:function(v){return v=='auto'?v:(xui.isFinite(v)||this.$isPx(v))?Math.round(parseFloat(v)||0)+'px':v+''}
    },
    Initialize:function(){
        var b=xui.browser,
            inlineblock= (b.gek
                    ? b.ver<3 
                        ? ((b.ver<3?"-moz-outline-offset:-1px !important;":"") + "display:-moz-inline-block;display:-moz-inline-box;display:inline-block;")
                        :"display:inline-block;"
                    : b.ie6
                        ?"display:inline-box;display:inline;"
                    :"display:inline-block;")+
                (b.ie?"zoom:1;":""),
            css =  ".xui-node{margin:0;padding:0;line-height:1.22;-webkit-text-size-adjust:none;}"+
            ".xui-node-highlight{color:#000;}"+
            ".xui-title-node{}"+
            ".xuifont-hover, .xuicon-hover{ color: #686868; }"+
            (!xui.browser. && xui.browser.deviceType != 'touchOnly'?".xuifont-active, .xuicon-active{ color: #3393D2; }":"")+
            ".xuifont-checked, .xuicon-checked{ color: #3393D2; }"+
            
            ".xui-wrapper{color:#000;font-family:arial,helvetica,clean,sans-serif;font-style:normal;font-weight:normal;vertical-align:middle;}"+
            ".xui-cover{cursor:wait;background:url("+xui.ini.img_bg+") transparent repeat;opacity:1;}"+
            ".xui-node-table{border-collapse:collapse;border-spacing:0;empty-cells:show;font-size:inherit;"+(b.ie?"font:100%;":"")+"}"+
            ".xui-node-fieldset,.xui-node-img{border:0;}"+
            ".xui-node-ol,.xui-node-ul,.xui-node-li{list-style:none;}"+
            ".xui-node-caption,.xui-node-th{text-align:left;}"+
            ".xui-node-th{font-weight:normal;}"+
            ".xui-node-q:before,.xui-node-q:after{content:'';}"+
            ".xui-node-abbr,.xui-node-acronym{border:0;font-variant:normal;}"+
            ".xui-node-sup{vertical-align:text-top;}"+
            ".xui-node-sub{vertical-align:text-bottom;}"+
            ".xui-node-input,.xui-node-textarea,.xui-node-select{cursor:text;font-family:inherit;font-size:inherit;font-weight:inherit;"+(b.ie?"font-size:100%;":"")+"}"+
            ".xui-node-del,.xui-node-ins{text-decoration:none;}"+
            ".xui-node-pre,.xui-node-code,.xui-node-kbd,.xui-node-samp,.xui-node-tt{font-family:monospace;"+(b.ie?"font-size:108%;":"")+"line-height:100%;}"+
// dont use font(use font-size/font-family) in IE678
            ".xui-node-select,.xui-node-input,.xui-node-textarea{font-family:arial,helvetica,clean,sans-serif;border-width:1px;}"+
            ((b.ie && b.ver<=8)?".xui-node-input{overflow:hidden;}":"")+
// base setting
            ".xui-node-a, .xui-node-a .xui-node{cursor:pointer;color:#0000ee;text-decoration:none;}"+
            ".xui-node-a:hover, .xui-node-a:hover .xui-node{color:red}"+
            (b.gek? (".xui-node-a:focus{outline-offset:-1px;"+ (b.ver<3?"-moz-outline-offset:-1px !important":"") +"}" ):"")+
            ".xui-node-span, .xui-node-div{border:0;}"+
            ((b.ie && b.ver<=8)?"":".xui-node-span:not(.xui-showfocus):focus, .xui-node-div:not(.xui-showfocus):focus{outline:0;}.xui-showfocus:focus{outline-width: 1px;outline-style: dashed;}")+
            ".xui-node-span, .xui-wrapper span"+((b.ie && b.ver<=7)?"":", .xui-v-wrapper:before, .xui-v-wrapper > .xui-v-node")+"{outline-offset:-1px;"+
            inlineblock+
            "}"+
            ".xui-node-h1,.xui-node-h2,.xui-node-h3,.xui-node-h4,.xui-node-h5,.xui-node-h6{font-size:100%;font-weight:normal;}"+
            ".xui-node-h1{font-size:138.5%;}"+
            ".xui-node-h2{font-size:123.1%;}"+
            ".xui-node-h3{font-size:108%;}"+
            ".xui-node-h1,.xui-node-h2,.xui-node-h3{margin:1em 0;}"+
            ".xui-node-h1,.xui-node-h2,.xui-node-h3,.xui-node-h4,.xui-node-h5,.xui-node-h6,.xui-node-strong{font-weight:bold;}"+
            ".xui-node-em{font-style:italic;}"+
            ".xui-node-legend{color:#000;}"+
            (b.ie6?("#"+xui.$localeDomId+"{vertical-align:baseline;}"):"")+
            
            // some cross browser css solution
            ".xui-nofocus:focus{outline:0;}"+
            ".xui-cls-wordwrap{"+
                "white-space: pre-wrap;word-break: break-all;" + // css-3
                (b.gek?"white-space: -moz-pre-wrap;":"") +  // Mozilla, since 1999
                (b.opr?"white-space: -pre-wrap;":"") + // Opera 4-6
                (b.opr?"white-space: -o-pre-wrap;":"") + // Opera 7
                (b.ie?"word-wrap: break-word;":"")+ // Internet Explorer 5.5+
           "}"+
           ((b.ie && b.ver<=8)?"":(".xui-v-wrapper:before{content:'';height:100%;font-size:0;vertical-align:middle;}"+
           ".xui-v-wrapper > .xui-v-node{vertical-align:middle;}"+
           ".xui-v-top > .xui-v-wrapper:before{vertical-align:top;}"+
           ".xui-v-top > .xui-v-wrapper > .xui-v-node{vertical-align:top;}"+
           ".xui-v-bottom > .xui-v-wrapper:before{vertical-align:bottom;}"+
           ".xui-v-bottom > .xui-v-wrapper > .xui-v-node{vertical-align:bottom;}"))+
            ".xui-node-tips{background-color:#FDF8D2;}"+

            // must here for get correct base font size
            ".xuifont, .xuicon{font-size:1.3333333333333333em;line-height:1em;}"+
            ".xuicon{margin: 0 .25em;"+
            inlineblock +
            "}" +
            ".xuicon:before{height:1em;width:1em;}" + 
            ".xui-ui-ctrl, .xui-ui-reset{font-family:arial,helvetica,clean,sans-serif; font-style:normal; font-weight:normal; vertical-align:middle; color:#000; }" + 
            //xui-ui-ctrl must be after xui-ui-reset
            ".xui-ui-reset{font-size: inherit;}"+
            // html(default 10px) > .xui-ui-ctrl(rem) > inner nodes(em)
            ".xui-ui-ctrl{cursor:default;font-size:1rem;}"+
            ".xui-title-node{font-size:1.1667em  !important;}"
           ;

        this.addStyleSheet(css, 'xui.CSS');
        
        /*
        xui.Thread.repeat(function(t){
            if((t=xui.CSS._dftEm) && (t!==xui.CSS._getDftEmSize(true)))xui.CSS.adjustFont();
        }, 10000);
        */
    }   
});xui.Class('xui.DomProfile', 'xui.absProfile', {
    Constructor: function (domId) {
        var upper = arguments.callee.upper;
        if (upper) upper.call(this);
        upper = null;
        xui.$cache.profileMap[this.domId = domId] = this;
    },
    Instance: {
        __gc: function () {
            delete xui.$cache.profileMap[this.domId];
        },
        _getEV: function (funs, id, name) {
            var t = xui.$cache.profileMap[id];
            if (t && (t = t.events) && (t = t[name]))
                for (var i = 0, l = t.length; i < l; i++)
                    if (typeof t[t[i]] == 'function')
                        funs[funs.length] = t[t[i]];
        }
    },
    Static: {
        get: function (id) {
            return xui.$cache.profileMap[id];
        },
        $abstract: true
    }
});

/*xui.Dom
*/
xui.Class('xui.Dom', 'xui.absBox', {
    Instance: {
        get: function (index) {
            var purge = xui.$cache.domPurgeData, t = this._nodes, s;
            if (xui.isNumb(index))
                return (s = t[index]) && (s = purge[s]) && s.element;
            else {
                var a = [], l = t.length;
                for (var i = 0; i < l; i++)
                    a[a.length] = (s = purge[t[i]]) && s.element;
                return a;
            }
        },
        each: function (fun, desc) {
            var ns = this, purge = xui.$cache.domPurgeData, n,
                i, j = ns._nodes, l = j.length;
            if (desc) {
                for (i = l; i >= 0; i--)
                    if ((n = purge[j[i]]) && (n = n.element))
                        if (false === fun.call(ns, n, i))
                            break;
            } else {
                for (i = 0; i < l; i++)
                    if ((n = purge[j[i]]) && (n = n.element))
                        if (false === fun.call(ns, n, i))
                            break;
            }
            n = null;
            return ns;
        },

        serialize: function () {
            var a = [];
            this.each(function (o) {
                a[a.length] = o.id;
            });
            return "xui(['" + a.join("','") + "'])";
        },
        xid: function () {
            return xui.getId(this.get(0));
        },
        //Need to consider the cache in xui.$cache.profileMap
        id: function (value, ignoreCache) {
            var t, i, cache = xui.$cache.profileMap;
            if (typeof value == 'string')
                return this.each(function (o) {
                    if ((i = o.id) !== value) {
                        if (!ignoreCache && (t = cache[i])) {
                            cache[value] = t;
                            delete cache[i];
                        }
                        o.id = value;
                    }
                });
            else
                return this.get(0) && this.get(0).id;
        },

        /*dom collection
        fun: fun to run
        args: arguments for fun
        */
        $sum: function (fun, args) {
            var arr = [], r, i;
            this.each(function (o) {
                r = fun.apply(o, args || []);
                if (r) {
                    if (xui.isArr(r))
                        for (i = 0; o = r[i]; i++)
                            arr[arr.length] = o;
                    else
                        arr[arr.length] = r;
                }
            });
            return xui(arr);
        },
        /*get all dir children
        */
        children: function () {
            return this.$sum(function () {
                return xui.toArr(this.childNodes)
            });
        },
        /* clone
         deep for clone all children
        */
        clone: function (deep) {
            return this.$sum(function () {
                var n = this.cloneNode(deep ? true : false),
                    children = n.getElementsByTagName('*'),
                    ie = xui.browser.ie && xui.browser.ver < 9,
                    i = 0, o;
                if (ie) n.removeAttribute('$xid');
                else delete n.$xid;
                for (; o = children[i]; i++) {
                    if (ie) o.removeAttribute('$xid');
                    else delete o.$xid;
                }
                return n;
            }, arguments);
        },
        /* iterator
        // type: left : x-axis,  top :y-axis, xy: x-axis and y-axis
        // dir : true => left to right; top to buttom, false => right to left ; bottom to top
        // inn: does start consider children
         fun : number or function => number is iterator index; function is "return true ->stop"
        */
        $iterator: function (type, dir, inn, fun, top) {
            return this.$sum(function (type, dir, inn, fun, top) {
                var self = arguments.callee;
                if (typeof fun != 'function') {
                    var count = fun || 0;
                    fun = function (n, index) {
                        return index == count;
                    }
                }
                var index = 0, m, n = this, flag = 0, t;
                while (n) {
                    if (n.nodeType == 1)
                        if (fun(n, index++) === true) break;

                    //x-axis true: right ;false: left
                    if (type == 'x')
                        n = dir ? n.nextSibling : n.previousSibling;
                    //y-axis true: down ;false: up
                    else if (type == 'y')
                        n = dir ? self.call(dir === 1 ? n.lastChild : n.firstChild, 'x', (dir !== 1), true, 0, top) : n.parentNode;
                    else {
                        inn = xui.isBool(inn) ? inn : true;
                        m = null;
                        n = dir ?
                            (t = inn && n.firstChild) ? t
                                : (t = n.nextSibling) ? t
                                : (m = n.parentNode)
                            : (t = inn && n.lastChild) ? t
                                : (t = n.previousSibling) ? t
                                    : (m = n.parentNode);
                        if (m) {
                            while (!(m = dir ? n.nextSibling : n.previousSibling)) {
                                n = n.parentNode;
                                //to the top node
                                if (!n)
                                    if (flag)
                                        return null;
                                    else {
                                        flag = true;
                                        m = dir ? document.body.firstChild : document.body.lastChild;
                                        break;
                                    }
                            }
                            n = m;
                        }
                        inn = true;
                    }
                }
                return n;
            }, arguments);
        },
        /*
        query('div');
        query('div','id');
        query('div','id','a');
        query('div','id',/^a/);
        query('div',function(){return true});
        */
        query: function (tagName, property, expr) {
            tagName = tagName || '*';
            var f = 'getElementsByTagName',
                me = arguments.callee, f1 = me.f1 || (me.f1 = function (tag, attr, expr) {
                    var all = this[f](tag), arr = [];
                    if (expr.test(this[attr]))
                        arr[arr.length] = this;
                    for (var o, i = 0; o = all[i]; i++)
                        if (expr.test(o[attr]))
                            arr[arr.length] = o;
                    return arr;
                }), f2 = me.f2 || (me.f2 = function (tag, attr, expr) {
                    var all = this[f](tag), arr = [];
                    if (this[attr] == expr)
                        arr[arr.length] = this;
                    for (var o, i = 0; o = all[i]; i++)
                        if (o[attr] == expr)
                            arr[arr.length] = o;
                    return arr;
                }), f3 = me.f3 || (me.f3 = function (tag, attr, expr) {
                    var all = this[f](tag), arr = [];
                    if (this[attr])
                        arr[arr.length] = this;
                    for (var o, i = 0; o = all[i]; i++)
                        if (o[attr])
                            arr[arr.length] = o;
                    return arr;
                }), f4 = me.f4 || (me.f4 = function (tag) {
                    return xui.toArr(this[f](tag));
                }), f5 = me.f5 || (me.f5 = function (tag, attr) {
                    var all = this[f](tag), arr = [];
                    if (attr(this))
                        arr[arr.length] = this;
                    for (var o, i = 0; o = all[i]; i++)
                        if (attr(o))
                            arr[arr.length] = o;
                    return arr;
                });
            return this.$sum(property ? typeof property == 'function' ? f5 : expr ? xui.isReg(expr) ? f1 : f2 : f3 : f4, [tagName, property, expr]);
        },
        querySelector: function (selectors) {
            return this.$sum(function () {
                return this.querySelector(selectors);
            });
        },
        querySelectorAll: function (selectors) {
            return this.$sum(function () {
                return xui.toArr(this.querySelectorAll(selectors));
            });
        },
        /*
        dom add implementation
        for addPrev prepend addNext append
        */
        $add: function (fun, target, reversed) {
            if (xui.isHash(target) || xui.isStr(target))
                target = xui.create(target);
            if (reversed) {
                reversed = xui(target);
                target = this;
            } else {
                target = xui(target);
                reversed = this;
            }
            if (target._nodes.length) {
                var one = reversed.get(0),
                    ns = target.get(),
                    dom = xui.Dom,
                    cache = xui.$cache.profileMap,
                    fragment, uiObj, p, i, o, j, v, uiObj, arr = [];
                target.each(function (o) {
                    uiObj = (p = o.id) && (p = cache[p]) && p.LayoutTrigger && (one === xui('body').get(0) || dom.getStyle(one, 'display') != 'none') && p.LayoutTrigger;
                    if (uiObj) arr.push([uiObj, p]);
                });
                if (ns.length == 1)
                    fragment = ns[0];
                else {
                    fragment = document.createDocumentFragment();
                    for (i = 0; o = ns[i]; i++)
                        fragment.appendChild(o);
                }
                fun.call(one, fragment);
                for (i = 0; o = arr[i]; i++) {
                    for (j = 0; v = o[0][j]; j++)
                        v.call(o[1]);
                    if (o[1].onLayout)
                        o[1].boxing().onLayout(o[1]);
                }
                arr.length = 0;

                one = o = fragment = null;
            }

            return this;
        },
        prepend: function (target, reversed) {
            return this.$add(function (node) {
                if (this.previousSibling != node) {
                    if (this.firstChild) this.insertBefore(node, this.firstChild);
                    else this.appendChild(node);
                }
            }, target, reversed);
        },
        append: function (target, reversed, force) {
            return this.$add(function (node) {
                try {
                    if (force || (node && this != node.parentNode && this.appendChild)) {
                        this.appendChild(node);
                    }
                } catch (e) {
                    console.warn(e)
                }
            }, target, reversed);
        },
        addPrev: function (target, reversed) {
            return this.$add(function (node) {
                if (this.firstChild != node)
                    this.parentNode.insertBefore(node, this);
            }, target, reversed);
        },
        addNext: function (target, reversed) {
            return this.$add(function (node) {
                if (this.nextSibling != node) {
                    if (this.nextSibling) this.parentNode.insertBefore(node, this.nextSibling);
                    else this.parentNode.appendChild(node);
                }
            }, target, reversed);
        },

        //flag: false => no remove this from momery(IE)
        replace: function (target, triggerGC) {
            if (xui.isHash(target) || xui.isStr(target))
                target = xui.create(target);
            target = xui(target);
            var v, i, c = this.get(0), ns = target.get(), l = ns.length;
            if (l > 0 && (v = ns[l - 1])) {
                c.parentNode.replaceChild(v, c);
                for (i = 0; i < l - 1; i++)
                    v.parentNode.insertBefore(ns[i], v);
                //for memory __gc
                if (triggerGC)
                    this.remove();
            }
            c = v = null;
            return target;
        },
        swap: function (target) {
            var self = this, t = xui.Dom.getEmptyDiv().html('*', false);

            if (xui.isHash(target) || xui.isStr(target))
                target = xui.create(target);
            target = xui(target);

            self.replace(t, false);
            target.replace(self, false);
            t.replace(target, false);

            t.get(0).innerHTML = '';
            document.body.insertBefore(t.get(0), document.body.firstChild);
            return self;
        },
        //flag : false => remove from dom tree, not free memory
        remove: function (triggerGC, purgeNow, callback) {
            if (triggerGC === false)
                this.each(function (o, i) {
                    if (o.raphael && o.remove) o.remove();
                    else if (o.parentNode) o.parentNode.removeChild(o);
                });
            else {
                var c = xui.$getGhostDiv();
                // append to ghost first
                this.each(function (o) {
                    c.appendChild(o);
                }, true);
                var f = function () {
                    xui.$purgeChildren(c);
                    if (callback) {
                        xui.tryF(callback);
                        callback = null;
                    }
                    c = null;
                };
                // for performance
                if (purgeNow) f(); else xui.asyRun(f);
            }
            return this;
        },
        //set innerHTML empty
        //flag = false: no gc
        empty: function (triggerGC, purgeNow) {
            return this.each(function (o) {
                xui([o]).html('', triggerGC, null, purgeNow);
            });
        },

        //flag = false: no gc
        html: function (content, triggerGC, loadScripts, purgeNow, callback) {
            var s = '', t, i, o = this.get(0);
            triggerGC = triggerGC !== false;
            if (content !== undefined) {
                if (o) {
                    if (o.nodeType == 3)
                        o.nodeValue = content;
                    else {
                        if (!o.firstChild && content === "") return this;
                        // innerHTML='' in IE, will clear it's childNodes innerHTML
                        // only asy purgeChildren need this line
                        // if(!triggerGC && xui.browser.ie)while(t=o.firstChild)o.removeChild(t);
                        //clear first
                        if (triggerGC) {
                            // append to ghost first
                            var c = xui.$getGhostDiv();
                            for (i = o.childNodes.length - 1; i >= 0; i--)
                                c.appendChild(o.childNodes[i]);
                            var f = function () {
                                xui.$purgeChildren(c);
                                if (callback) {
                                    xui.tryF(callback);
                                    callback = null;
                                }
                                c = null;
                            };
                            // for performance
                            if (purgeNow) f(); else xui.asyRun(f);
                        }

                        var scripts;
                        if (loadScripts) {
                            var reg1 = /(?:<script([^>]*)?>)((\n|\r|.)*?)(?:<\/script>)/ig,
                                reg2 = /(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)/ig,
                                reg3 = /\ssrc=([\'\"])(.*?)\1/i,
                                matched, attr, src;
                            scripts = [];
                            while ((matched = reg1.exec(content))) {
                                attr = matched[1];
                                src = attr ? attr.match(reg3) : false;
                                if (src && src[2]) {
                                    scripts.push([1, src[2]]);
                                } else if (matched[2] && matched[2].length > 0) {
                                    scripts.push([2, matched[2]]);
                                }
                            }
                            content = content.replace(reg2, '');
                        }

                        o.innerHTML = content;
                        if (scripts && scripts.length > 0) {
                            xui.arr.each(scripts, function (s) {
                                if (s[0] == 1)
                                    xui.include(null, s[1]);
                                else
                                    xui.exec(s[1]);
                            });
                        }

                        //if(triggerGC)
                        //    xui.UI.$addEventsHandler(o);

                    }
                    o = null;
                }
                return this;
            } else {
                if (o) {
                    s = (o.nodeType == 3) ? o.nodeValue : o.innerHTML;
                    o = null;
                }
                return s;
            }
        },
        loadHtml: function (options, onStart, onEnd) {
            var ns = this;
            if (typeof options == 'string') options = {url: options};
            xui.tryF(onStart);
            xui.Ajax(options.url, options.query, function (rsp) {
                var n = xui.create("div");
                n.html(rsp, false, true);
                ns.append(n.children());
                xui.tryF(onEnd);
            }, function (err) {
                ns.append("<div>" + err + "</div>");
                xui.tryF(onEnd);
            }, null, options.options).start();
        },
        loadIframe: function (options, domId) {
            if (typeof options == 'string') options = {url: options};
            var id = domId || ("aiframe_" + xui.stamp()), t;
            if (t = xui.Dom.byId(domId)) {
                xui(t).remove();
            }
            var e = xui.browser.ie && xui.browser.ver < 9,
                ifr = document.createElement(e ? "<iframe name='" + id + "'>" : "iframe");
            ifr.id = ifr.name = id;
            ifr.src = options.url;
            ifr.frameBorder = '0';
            ifr.marginWidth = '0';
            ifr.marginHeight = '0';
            ifr.vspace = '0';
            ifr.hspace = '0';
            ifr.allowTransparency = 'true';
            ifr.width = '100%';
            ifr.height = '100%';
            this.append(ifr);
            xui.Dom.submit(options.url, options.query, options.method, ifr.name, options.enctype);
        },
        outerHTML: function (content, triggerGC) {
            var self = this, t, s = '', o = self.get(0), id = o.id;
            if (content !== undefined) {
                var n = self.replace(xui.str.toDom(content), false);
                self._nodes[0] = n._nodes[0];

                //avoid inner nodes memory leak
                xui([o]).remove(triggerGC);
                return self;
            } else {
                if (xui.browser.gek) {
                    var m = xui.$getGhostDiv();
                    m.appendChild(self.get(0).cloneNode(true));
                    s = m.innerHTML;
                    m.innerHTML = "";
                    m = null;
                } else {
                    s = o.outerHTML;
                }
                o = null;
                return s;
            }
        },
        text: function (content) {
            if (content !== undefined) {
                var self = this, arr = [], txt;
                self.each(function (o) {
                    for (var i = o.childNodes.length - 1, t; i >= 0; i--)
                        if ((t = o.childNodes[i]) && t.nodeType == 3)
                            t.nodeValue = "";
                    o.appendChild(document.createTextNode(content));
                });
                return self;
            } else {
                return (function (o) {
                    if (!o) return '';
                    return o.textContent || o.innerText;
                    /*
                  var i,a=o.childNodes,l=a.length,content='',me=arguments.callee;
                  for(i=0;i<l;i++)
                    if(a[i].nodeType!= 8)
                      content += (a[i].nodeType!=1) ? a[i].nodeValue : me(a[i]);
                  return content;
                  */
                })(this.get(0));
            }
        },
        /*
        .attr(name)=>get attr
        .attr(name,value)=>set attr
        .attr(name,null)=>remove attr
        */
        attr: function (name, value) {
            //set one time only
            var self = this,
                me = arguments.callee,
                map1 = me.map1 || (me.map1 = {
                    'class': 'className',
                    readonly: "readOnly",
                    tabindex: "tabIndex",
                    'for': 'htmlFor',
                    maxlength: "maxLength",
                    cellspacing: "cellSpacing",
                    rowspan: "rowSpan",
                    value: 'value'
                }),
                map2 = me.map2 || (me.map2 = {
                    href: 1, src: 1, style: 1
                });

            if (typeof name == 'object') {
                for (var i in name)
                    me.call(self, i, name[i]);
                return self;
            }

            var iestyle = xui.browser.ie && name == 'style',
                normal = !map2[name = map1[name] || name];
            if (value !== undefined) {
                return self.each(function (o) {
                    //remove attr
                    if (value === null) {
                        if (iestyle) o.style.cssText = '';
                        else if (normal) {
                            try {
                                o[name] = null;
                                if (o.nodeType == 1) o.removeAttribute(name)
                            } catch (e) {
                            }
                        }
                        //set attr
                    } else {
                        value = name == 'style' ? (value + '').replace(/[;]+/g, ';').replace(/^;/, '') : value;
                        if (iestyle) o.style.cssText = '' + value;
                        else if (normal) {
                            o[name] = value;
                            if (o.nodeType == 1 && name != "value" && typeof value == 'string') o.setAttribute(name, value);
                        } else
                            o.setAttribute(name, value);
                    }
                });
                //get attr
            } else {
                var r, o = self.get(0);
                if (iestyle) return o.style.cssText;
                if (name == "selected" && xui.browser.kde) return o.parentNode.selectedIndex;
                r = ((name in o) && normal) ? o[name] : o.getAttribute(name, xui.browser.ie && !normal ? 2 : undefined);
                o = null;
                return name == 'style' ? r.replace(/[;]+/g, ';').replace(/^;/, '') : r;
            }
        },
        $touchscroll: function (type) {
            if (xui.browser. || (xui.browser.isTouch && (xui.browser.isAndroid || xui.browser.isBB))) {
                var hash = {"x": 1, "y": 1, "xy": 1}, nodes = this._nodes, getD = function (t) {
                        var o = xui.getNodeData(t, '_wheelscroll');
                        if (!o) xui.setNodeData(t, '_wheelscroll', o = {});
                        return o;
                    },
                    doSwipe = function (t) {
                        var wheel = getD(t);
                        if ((wheel._speedx || wheel._speedy) && ((new Date).getTime() - wheel._lastTime) < 50) {
                            var params = {}, sl = t.scrollLeft, st = t.scrollTop, limit = 50, rate = 40,
                                duration = 2000, m;
                            if (wheel._speedx) {
                                m = [Math.max(0, sl), Math.max(0, sl + Math.sign(wheel._speedx) * Math.min(limit, Math.abs(wheel._speedx)) * rate)];
                                if (m[0] !== m[1]) params.scrollLeft = m;
                            }
                            if (wheel._speedy) {
                                m = [Math.max(0, st), Math.max(0, st + Math.sign(wheel._speedy) * Math.min(limit, Math.abs(wheel._speedy)) * rate)];
                                if (m[0] !== m[1]) params.scrollTop = m;
                            }
                            if (!xui.isEmpty(params)) {
                                var tid = xui.getNodeData(t, '_inthread');
                                if (tid) {
                                    xui.Thread.abort(tid);
                                    xui.setNodeData(t, '_inthread');
                                    xui.setData(['!document', '$fakescroll']);
                                }
                                xui(t).animate(params, null, null, duration, null, "expoOut").start();
                            }
                        }
                        wheel._opx = wheel._opy = wheel._ox = wheel._oy = wheel._lastTime = wheel._speedx = wheel._speedy = null;
                    };
                if (!hash[type]) type = null;
                xui(nodes)[xui.browser. ? 'onMousedown' : 'onTouchstart'](hash[type] ? function (p, e, src) {
                    if (xui.DragDrop._profile.isWorking) return true;
                    if (!xui(src).scrollable('x') && !xui(src).scrollable('y')) return true;
                    var s, t = xui(src).get(0);
                    var tid = xui.getNodeData(t, '_inthread');
                    if (tid) {
                        xui.Thread.abort(tid);
                        xui.setNodeData(t, '_inthread');
                    }
                    var wheel = getD(t);

                    if (xui.browser.fakeTouch) {
                        if (xui.Event.getBtn(e) !== 'left') return true;
                        s = e;
                    } else {
                        if (e.touches.length > 1) return true;
                        s = e.touches[0];
                    }
                    if (t) {
                        if (type == 'xy' || type == 'x') {
                            wheel._ox = t.scrollLeft;
                            wheel._opx = s.pageX;
                        }
                        if (type == 'xy' || type == 'y') {
                            wheel._oy = t.scrollTop
                            wheel._opy = s.pageY;
                        }
                    }
                    // ***add for fake case
                    if (xui.browser.fakeTouch) {
                        xui.setData(['!document', '$fakescroll'], src);
                        xui.doc.onMouseup(function (p, e, src) {
                            xui.setData(['!document', '$fakescroll']);
                            xui.asyRun(function () {
                                xui.setData(['!document', '$fakescrolling']);
                            });
                            // ***clear for fake case
                            xui.doc.onMouseup(null, 'touchscroll');
                            doSwipe(t);
                        }, 'touchscroll');
                        return false;
                    }
                    return true;
                } : null, 'touchscroll');

                xui(nodes)[xui.browser.fakeTouch ? 'onMousemove' : 'onTouchmove'](hash[type] ? function (p, e, src) {
                    if (xui.DragDrop._profile.isWorking) return true;
                    if (xui.browser.fakeTouch && xui.getData(['!document', '$fakescroll']) != src) return true;
                    var s, t = xui(src).get(0), x1, y1, first;
                    if (xui.browser.fakeTouch) {
                        if (xui.Event.getBtn(e) !== 'left') return true;
                        s = e;
                    } else {
                        if (e.touches.length > 1) return true;
                        s = e.touches[0];
                    }
                    if (t) {
                        var wheel = getD(t);
                        wheel._lastTime = (new Date).getTime();
                        x1 = t.scrollLeft;
                        y1 = t.scrollTop;
                        if (type == 'xy' || type == 'x') {
                            t.scrollLeft = wheel._ox + wheel._opx - s.pageX;
                            if (x1 == t.scrollLeft) {
                                wheel._ox = t.scrollLeft;
                                wheel._opx = s.pageX;
                            } else {
                                wheel._speedx = t.scrollLeft - x1;
                            }
                        }
                        if (type == 'xy' || type == 'y') {
                            if (wheel._oy === null) wheel._oy = t.scrollTop + wheel._opy;
                            t.scrollTop = wheel._oy + wheel._opy - s.pageY;

                            if (y1 == t.scrollTop) {
                                wheel._oy = t.scrollTop;
                                wheel._opy = s.pageY;
                            } else {
                                wheel._speedy = t.scrollTop - y1;
                            }
                        }
                        // effected
                        if (xui.browser.fakeTouch) {
                            if (x1 !== t.scrollLeft || y1 !== t.scrollTop) {
                                xui.setData(['!document', '$fakescrolling'], 1);
                            }
                        }
                        return x1 == t.scrollLeft && y1 == t.scrollTop;
                    }
                } : null, 'touchscroll');

                xui(nodes).onTouchend(hash[type] ? function (p, e, src) {
                    if (xui.DragDrop._profile.isWorking) return true;
                    if (e.touches.length > 1) return true;
                    doSwipe(xui(src).get(0));
                } : null, 'touchscroll');
            }
            return this;
        },
        isScrollBarShowed: function (type) {
            var n = this.get(0);
            if (n) return type == 'y' ? ((n.offsetWidth || 0) > (n.clientWidth || 0)) : ((n.offsetHeight || 0) > (n.clientHeight || 0));
        },
        scrollable: function (type) {
            type = type == 'x' ? 'scrollLeft' : 'scrollTop';
            if (this[type]() !== 0) return true;
            this[type](1);
            if (this[type]() === 0) return false;
            this[type](0);
            return true;
        },
        scrollIntoView: function () {
            return this.each(function (o) {
                o.scrollIntoView();
            });
        },
        /*
        name format: 'xxxYxx', not 'xxx-yyy'
        left/top/width/height like, must specify 'px'
        Does't fire onResize onMove event
        */
        css: function (name, value, force) {
            if (typeof name == 'object' || value !== undefined) {
                this.each(function (o) {
                    xui.Dom.setStyle(o, name, value)
                });

                if (xui.browser.fakeTouch || (xui.browser.isTouch && (xui.browser.isAndroid || xui.browser.isBB))) {
                    if (name == 'overflow' || name == 'overflow-x' || name == 'overflow-y') {
                        if (value == 'auto' || value == 'scroll')
                            this.$touchscroll(name == 'overflow' ? 'xy' : name == 'overflow-x' ? 'x' : 'y');
                        else
                            this.$touchscroll(null);
                    }
                }
                return this;
            } else {
                return xui.Dom.getStyle(this.get(0), name, force);
            }
            ;
        },
        _getEmSize: function (rate) {
            return this.get(0) ? (parseFloat(xui.Dom.getStyle(this.get(0), 'fontSize', true)) || xui.CSS._getDftEmSize()) * (rate || 1) : null;
        },
        rotate: function (v) {
            if (xui.isSet(v)) {
                v = parseFloat(v) || 0;
                v = v % 360;
                if (v < 0) v = v + 360;
                return this.each(function (o) {
                    if (o.raphael && o.id) {
                        var prf = xui.Event._getProfile(o.id);
                        if ((prf = prf && prf.parent && prf.parent._paper) && (o = prf.getById(o.raphaelid)))
                            o.transform('r' + v);
                    } else {
                        v += 'deg';
                        var transform = o.style.transform || "";
                        if (/rotate\([^)]*\)/i.test(transform)) transform = transform.replace(/(rotate\()([^)]+)/i, '$1' + v);
                        else transform += " rotate(" + v + ")";
                        xui.Dom.setStyle(o, 'transform', transform);
                    }
                });
            } else {
                var o = this.get(0);
                if (o.raphael && o.id) {
                    var prf = xui.Event._getProfile(o.id);
                    if ((prf = prf && prf.parent && prf.parent._paper) && (o = prf.getById(o.raphaelid))) {
                        // for format
                        o = o.transform();
                        if (xui.isArr(o)) {
                            if (!o.length) o = "";
                            else o = o.join();
                        } else {
                            if (!o) o = "";
                            else o = Raphael.parseTransformString(o).join();
                        }
                        var arr = /r,([-\d.]+)/i.exec(o);
                        v = arr ? parseFloat(arr[1] || 0) : 0;
                        v = v % 360;
                        if (v < 0) v = v + 360;
                        return v;
                    }
                    return 0;
                } else {
                    var arr = /rotate\(([-\d.]+)/i.exec(o.style.transform);
                    return arr ? parseFloat(arr[1] || 0) : 0;
                }
            }
        },
        scaleX: function (v) {
            if (xui.isSet(v)) {
                return this.each(function (o) {
                    v = parseFloat(v);
                    if (o.raphael && o.id) {
                        v = v || 0;
                        var prf = xui.Event._getProfile(o.id), t;
                        if ((prf = prf && prf.parent && prf.parent._paper) && (o = prf.getById(o.raphaelid))) {
                            t = xui.clone(Raphael.parseTransformString(o.transform()), true);
                            // only for the first
                            if (t && t[0] && t[0][0] == "s") {
                                t[0][1] = v;
                            } else {
                                t = t || [];
                                t.unshift(['s', v, 1]);
                            }
                            o.transform(t);
                        }
                    } else {
                        if (xui.isNaN(v)) v = 1;
                        var transform = o.style.transform || "";
                        if (/(scale\()([^,]+),([^)]+)/i.test(transform)) transform = transform.replace(/(scale\()([^,]+),([^)]+)/i, '$1' + v + ',$3');
                        else if (/scale\([-\d.]*\)/i.test(transform)) transform = transform.replace(/scale\([-\d.]*\)/i, 'scale(' + v + ',1)');
                        else transform += " scale(" + v + ",1)";
                        xui.Dom.setStyle(o, 'transform', transform);
                    }
                });
            } else {
                var o = this.get(0);
                if (o.raphael && o.id) {
                    v = 1;
                    var prf = xui.Event._getProfile(o.id);
                    if ((prf = prf && prf.parent && prf.parent._paper) && (o = prf.getById(o.raphaelid))) {
                        xui.arr.each(Raphael.parseTransformString(o.transform()), function (t) {
                            if (t[0] == "s") v *= t[1];
                        });
                    }
                    return v;
                } else {
                    var arr = /(scale\()([^,]+),([^)]+)/i.exec(this.get(0).style.transform);
                    if (arr) return parseFloat(arr[2] || 1);
                    else {
                        arr = /scale\(([-\d.]*)\)/i.exec(this.get(0).style.transform);
                        return arr ? arr[1] : 1;
                    }
                }
            }
        },
        scaleY: function (v) {
            if (xui.isSet(v)) {
                return this.each(function (o) {
                    v = parseFloat(v);
                    if (o.raphael && o.id) {
                        v = v || 0;
                        var prf = xui.Event._getProfile(o.id), t;
                        if ((prf = prf && prf.parent && prf.parent._paper) && (o = prf.getById(o.raphaelid))) {
                            t = xui.clone(Raphael.parseTransformString(o.transform()), true);
                            // only for the first
                            if (t && t[0] && t[0][0] == "s") {
                                t[0][2] = v;
                            } else {
                                t = t || [];
                                t.unshift(['s', 1, v]);
                            }
                            o.transform(t);
                        }
                    } else {
                        if (xui.isNaN(v)) v = 1;
                        var transform = o.style.transform || "";
                        if (/(scale\()([^,]+),([^)]+)/i.test(transform)) transform = transform.replace(/(scale\()([^,]+),([^)]+)/i, '$1$2,' + v);
                        else if (/scale\([-\d.]*\)/i.test(transform)) transform = transform.replace(/scale\([-\d.]*\)/i, 'scale(1,' + v + ')');
                        else transform += " scale(1," + v + ")";
                        xui.Dom.setStyle(o, 'transform', transform);
                    }
                });
            } else {
                var o = this.get(0);
                if (o.raphael && o.id) {
                    v = 1;
                    var prf = xui.Event._getProfile(o.id);
                    if ((prf = prf && prf.parent && prf.parent._paper) && (o = prf.getById(o.raphaelid))) {
                        xui.arr.each(Raphael.parseTransformString(o.transform()), function (t) {
                            if (t[0] == "s") v *= t[2];
                        });
                    }
                    return v;
                } else {
                    var arr = /(scale\()([^,]+),([^)]+)/i.exec(this.get(0).style.transform);
                    if (arr) return parseFloat(arr[3] || 1);
                    else {
                        arr = /scale\(([-\d.]*)\)/i.exec(this.get(0).style.transform);
                        return arr ? arr[1] : 1;
                    }
                }
            }
        },
        translateX: function (v) {
            if (xui.isSet(v)) {
                return this.each(function (o) {
                    if (o.raphael && o.id) {
                        v = parseFloat(v) || 0;
                        var prf = xui.Event._getProfile(o.id), t;
                        // modify the last 't'
                        if ((prf = prf && prf.parent && prf.parent._paper) && (o = prf.getById(o.raphaelid))) {
                            t = xui.clone(Raphael.parseTransformString(o.transform()), true);
                            if (t && t.length && t[t.length - 1] && (t[t.length - 1][0] == "t")) {
                                t[t.length - 1][1] = v;
                            } else {
                                t = t || [];
                                t.push(['t', v, 0]);
                            }
                            o.transform(t);
                        }
                    } else {
                        v = xui.CSS.$addu(v);
                        var transform = o.style.transform || "";
                        if (/translate\([^)]*\)/i.test(transform)) transform = transform.replace(/(translate\()([^,]+),([^)]+)/i, '$1' + v + ',$3');
                        else transform += " translate(" + v + ",0)";
                        xui.Dom.setStyle(o, 'transform', transform);
                    }
                });
            } else {
                var o = this.get(0);
                if (o.raphael && o.id) {
                    v = 0;
                    var prf = xui.Event._getProfile(o.id);
                    if ((prf = prf && prf.parent && prf.parent._paper) && (o = prf.getById(o.raphaelid))) {
                        xui.arr.each(Raphael.parseTransformString(o.transform()), function (t) {
                            if (t[0] == "t") v += t[1];
                        });
                    }
                    return v;
                } else {
                    var arr = /(translate\()([^,]+),([^)]+)/i.exec(this.get(0).style.transform);
                    return arr ? (arr[2] || "").replace(/\s/g, '') : '';
                }
            }
        },
        translateY: function (v) {
            if (xui.isSet(v)) {
                return this.each(function (o) {
                    if (o.raphael && o.id) {
                        v = parseFloat(v) || 0;
                        var prf = xui.Event._getProfile(o.id);
                        if ((prf = prf && prf.parent && prf.parent._paper) && (o = prf.getById(o.raphaelid))) {
                            t = xui.clone(Raphael.parseTransformString(o.transform()), true);
                            // modify the last 't'
                            if (t && t.length && t[t.length - 1] && (t[t.length - 1][0] == "t")) {
                                t[t.length - 1][2] = v;
                            } else {
                                t = t || [];
                                t.push(['t', 0, v]);
                            }
                            o.transform(t);
                        }
                    } else {
                        v = xui.CSS.$addu(v);
                        var transform = o.style.transform || "";
                        if (/translate\([^)]*\)/i.test(transform)) transform = transform.replace(/(translate\()([^,]+),([^)]+)/i, '$1$2,' + v);
                        else transform += " translate(0," + v + ")";
                        xui.Dom.setStyle(o, 'transform', transform);
                    }
                });
            } else {
                var o = this.get(0);
                if (o.raphael && o.id) {
                    v = 0;
                    var prf = xui.Event._getProfile(o.id);
                    if ((prf = prf && prf.parent && prf.parent._paper) && (o = prf.getById(o.raphaelid))) {
                        xui.arr.each(Raphael.parseTransformString(o.transform()), function (t) {
                            if (t[0] == "t") v += t[2];
                        });
                    }
                    return v;
                } else {
                    var arr = /(translate\()([^,]+),([^)]+)/i.exec(this.get(0).style.transform);
                    return arr ? (arr[3] || "").replace(/\s/g, '') : '';
                }
            }
        },
        skewX: function (v) {
            if (xui.isSet(v)) {
                if (xui.isFinite(v)) v += 'deg';
                return this.each(function (o) {
                    var transform = o.style.transform || "";
                    if (/skew\([^)]*\)/i.test(transform)) transform = transform.replace(/(skew\()([^,]+),([^)]+)/i, '$1' + (v || 0) + ',$3');
                    else transform += " skew(" + v + ",0deg)";
                    xui.Dom.setStyle(o, 'transform', transform);
                });
            } else {
                var arr = /(skew\()([^,]+),([^)]+)/i.exec(this.get(0).style.transform);
                return arr ? parseFloat(arr[2] || 0) : 0;
            }
        },
        skewY: function (v) {
            if (xui.isSet(v)) {
                if (xui.isFinite(v)) v += 'deg';
                return this.each(function (o) {
                    var transform = o.style.transform || "";
                    if (/skew\([^)]*\)/i.test(transform)) transform = transform.replace(/(skew\()([^,]+),([^)]+)/i, '$1$2,' + (v || 0));
                    else transform += " skew(0deg," + v + ")";
                    xui.Dom.setStyle(o, 'transform', transform);
                });
            } else {
                var arr = /(skew\()([^,]+),([^)]+)/i.exec(this.get(0).style.transform);
                return arr ? parseFloat(arr[3] || 0) : 0;
            }
        },
        /*
        *IE/opera \r\n will take 2 chars
        *in IE: '/r/n'.lenght is 2, but range.moveEnd/moveStart will take '/r/n' as 1.
        */
        caret: function (begin, end) {
            var input = this.get(0), tn = input.nodeName.toLowerCase(), type = typeof begin, ie = xui.browser.ie, pos;
            if (!/^(input|textarea)$/i.test(tn)) return;
            if (tn == "input" && input.type.toLowerCase() != 'text' && input.type.toLowerCase() != 'password') return;
            input.focus();
            //set caret
            if (type == 'number') {
                if (ie) {
                    var r = input.createTextRange();
                    r.collapse(true);
                    r.moveEnd('character', end);
                    r.moveStart('character', begin);
                    r.select();
                } else {
                    input.focus();
                    input.setSelectionRange(begin, end);
                }
                return this;
                //replace text
            } else if (type == 'string') {
                var r = this.caret(), l = 0, m = 0, ret,
                    v = input.value,
                    reg1 = /\r/g;
                //for IE, minus \r
                if (ie) {
                    l = v.substr(0, r[0]).match(reg1);
                    l = (l && l.length) || 0;
                    m = begin.match(reg1);
                    m = (m && m.length) || 0;
                }
                //opera will add \r to \n, automatically
                if (xui.browser.opr) {
                    l = begin.match(/\n/g);
                    l = (l && l.length) || 0;
                    m = begin.match(/\r\n/g);
                    m = (m && m.length) || 0;
                    m = l - m;
                    l = 0;
                }
                input.value = v.substr(0, r[0]) + begin + v.substr(r[1], v.length);
                ret = r[0] - l + m + begin.length;
                this.caret(ret, ret);
                return ret;
                //get caret
            } else {
                if (ie && document.selection) {
                    var r = document.selection.createRange(),
                        txt = r.text,
                        l = txt.length,
                        e, m;
                    if (tn.toLowerCase() == 'input') {
                        r.moveStart('character', -input.value.length);
                        e = r.text.length;
                        return [e - l, e];
                    } else {
                        var rb = r.duplicate();
                        rb.moveToElementText(input);
                        rb.setEndPoint('EndToEnd', r);
                        e = rb.text.length;
                        return [e - l, e];
                    }
                    //firefox opera safari
                } else
                    return [input.selectionStart, input.selectionEnd];
            }
        },
        //left,top format: "23px"
        show: function (left, top, callback, showEffects, ignoreEffects) {
            var style, t, v = xui.Dom.HIDE_VALUE, vv;
            return this.each(function (o) {
                if (o.nodeType != 1) return;
                var tid = xui.getNodeData(o, '_inthread');
                if (tid) {
                    xui.Thread.abort(tid);
                    xui.setNodeData(o, '_inthread');
                }

                style = o.style;
                vv = xui.getNodeData(o);
                if (vv._xuihide) {
                    if ('_left' in vv) if (style.left != (t = vv._left)) style.left = t;
                    if ('_top' in vv) if (style.top != (t = vv._top)) style.top = t;
                    if ('_position' in vv) if (style.position != (t = vv._position)) style.position = t;
                    if (style.visibility != 'visible') style.visibility = 'visible';
                    vv._xuihide = 0;
                }
                if (xui.isSet(left)) style.left = left;
                if (xui.isSet(top)) style.top = top;
                //force to visible
//                if(style.visibility!='visible')style.visibility='visible';
//                if(style.display=='none')style.display='';

                //ie6 bug
                /*  if(xui.browser.ie&&xui.browser.ver<=6){
                    t=style.wordWrap=='normal';
                    xui.asyRun(function(){
                        style.wordWrap=t?'break-word':'normal'
                    })
                }*/
                showEffects = ignoreEffects ? null : showEffects ? showEffects : xui.get(xui.UIProfile.getFromDom(o), ['properties', 'showEffects']);
                if (showEffects) showEffects = xui.Dom._getEffects(showEffects, 1);
                if (showEffects) xui.Dom._vAnimate(o, showEffects, callback); else if (callback) callback();
            });
        },
        hide: function (callback, hideEffects, ignoreEffects) {
            var style, vv;
            return this.each(function (o) {
                if (o.nodeType != 1) return;
                var tid = xui.getNodeData(o, '_inthread');
                if (tid) {
                    xui.Thread.abort(tid);
                    xui.setNodeData(o, '_inthread');
                }

                style = o.style;
                vv = xui.getNodeData(o);
                var fun = function () {
                    if (vv._xuihide !== 1) {
                        vv._position = style.position;
                        vv._visibility = style.visibility;
                        vv._top = style.top;
                        vv._left = style.left;
                        vv._xuihide = 1;
                    }
                    if (style.position != 'absolute') style.position = 'absolute';
                    style.visibility = "hidden";
                    style.top = style.left = xui.Dom.HIDE_VALUE;

                    if (callback) callback();
                };
                hideEffects = ignoreEffects ? null : hideEffects ? hideEffects : xui.get(xui.UIProfile.getFromDom(o), ['properties', 'hideEffects']);
                if (hideEffects) hideEffects = xui.Dom._getEffects(hideEffects, 0);
                if (hideEffects) xui.Dom._vAnimate(o, hideEffects, fun); else fun();
            });
        },
        cssRegion: function (region, triggerEvent) {
            var self = this;
            if (typeof region == 'object') {
                var i, t, m, node = self.get(0), dom = xui.Dom, f = dom._setUnitStyle, m = {};
                for (var j = 0, c = dom._boxArr; i = c[j++];)
                    m[i] = ((i in region) && region[i] !== null) ? f(node, i, region[i]) : false;
                if (triggerEvent) {
                    var f = dom.$hasEventHandler;
                    if (f(node, 'onsize') && (m.width || m.height)) self.onSize(true, {
                        width: m.width,
                        height: m.height
                    });
                    if (f(node, 'onmove') && (m.left || m.top)) self.onMove(true, {left: m.left, top: m.top});
                }
                return self;
            } else {
                var offset = region, parent = triggerEvent,
                    pos = offset ? self.offset(null, parent) : self.cssPos(),
                    size = self.cssSize();
                return {
                    left: pos.left,
                    top: pos.top,
                    width: size.width,
                    height: size.height
                };
            }
        },
        //for quick size
        cssSize: function (size, triggerEvent) {
            var self = this, node = self.get(0), r, dom = xui.Dom, f = dom._setUnitStyle, b1, b2;
            if (node) {
                if (size) {
                    var t;
                    b1 = size.width !== null ? f(node, 'width', size.width) : false;
                    b2 = size.height !== null ? f(node, 'height', size.height) : false;
                    if (triggerEvent && (b1 || b2) && dom.$hasEventHandler(node, 'onsize')) self.onSize(true, {
                        width: b1,
                        height: b2
                    });
                    r = self;
                } else
                    r = {width: self._W(node, 1) || 0, height: self._H(node, 1)};
                return r;
            } else {
                return size ? self : {};
            }
        },
        //for quick move
        cssPos: function (pos, triggerEvent) {
            var node = this.get(0),
                dom = xui.Dom,
                css = xui.CSS,
                f = dom._setUnitStyle,
                b1, b2, r;
            if (pos) {
                var t;
                b1 = pos.left != null ? f(node, 'left', pos.left) : false;
                b2 = pos.top !== null ? f(node, 'top', pos.top) : false;
                if (triggerEvent && (b1 || b2) && dom.$hasEventHandler(node, 'onmove')) this.onMove(true, {
                    left: b1,
                    top: b2
                });
                r = this;
            }
            // get always returns to px
            else {
                f = dom.getStyle;
                r = {left: css.$px(f(node, 'left'), node), top: css.$px(f(node, 'top'), node)};
            }
            node = null;
            return r;
        },
        /*
        +--------------------------+
        |margin                    |
        | #----------------------+ |
        | |border                | |
        | | +------------------+ | |
        | | |padding           | | |
        | | | +--------------+ | | |
        | | | |   content    | | | |

        # is the offset position in EUSUI
        */
        offset: function (pos, boundary, original) {
            var r, t,
                browser = xui.browser,
                ns = this,
                node = ns.get(0),
                keepNode = node,
                parent = node.parentNode,
                op = node.offsetParent,
                doc = node.ownerDocument,
                dd = doc.documentElement,
                db = doc.body,
                _d = /^inline|table.*$/i,
                getStyle = xui.Dom.getStyle,
                fixed = getStyle(node, "position") == "fixed",

                me = arguments.callee,
                add = me.add || (me.add = function (pos, l, t) {
                    pos.left += parseFloat(l) || 0;
                    pos.top += parseFloat(t) || 0;
                }),
                border = me.border || (me.border = function (node, pos) {
                    add(pos, getStyle(node, 'borderLeftWidth'), getStyle(node, 'borderTopWidth'));
                }),
                TTAG = me.TTAG || (me.TTAG = {TABLE: 1, TD: 1, TH: 1}),
                HTAG = me.HTAG || (me.HTAG = {BODY: 1, HTML: 1}),
                posDiff = me.posDiff || (me.posDiff = function (o, target) {
                    var cssPos = o.cssPos(), absPos = o.offset(null, target);
                    return {left: absPos.left - cssPos.left, top: absPos.top - cssPos.top};
                });

            boundary = boundary ? xui(boundary).get(0) : doc;

            if (pos) {
                //all null, return dir
                if (pos.left === null && pos.top === null) return ns;
                var d = posDiff(ns, boundary);
                ns.cssPos({
                    left: pos.left === null ? null : (pos.left - d.left),
                    top: pos.top === null ? null : (pos.top - d.top)
                });
                r = ns;
            } else {
                //for IE, firefox3(except document.body)
                if (!(xui.browser.gek && node === document.body) && node.getBoundingClientRect) {
                    t = xui.Dom.$getBoundingClientRect(node, original);
                    pos = {left: t.left, top: t.top};
                    if (boundary.nodeType == 1 && boundary !== document.body)
                        add(pos, -(t = xui.Dom.$getBoundingClientRect(boundary, original)).left + boundary.scrollLeft, -t.top + boundary.scrollTop);
                    else {
                        // old:
                        // add(pos, (dd.scrollLeft||db.scrollLeft||0)-dd.clientLeft, (dd.scrollTop||db.scrollTop||0)-dd.clientTop);

                        // new:
                        // getBoundingClientRect returns different value in different browser
                        // some include window.scrollX/Y, others do not include
                        // we have to use a base div {left:0,top:0} to do offset, to replace "scrollXXX" offset solution
                        var base = xui.Dom.getEmptyDiv();
                        base.css({left: 0, top: 0, position: 'absolute'});
                        var basRect = xui.Dom.$getBoundingClientRect(base.get(0), original);
                        base.css({left: xui.Dom.HIDE_VALUE, top: xui.Dom.HIDE_VALUE});

                        // var basRect=xui.Dom.$getBoundingClientRect(db, original);
                        add(pos, -basRect.left, -basRect.top);
                    }
                } else {
                    pos = {left: 0, top: 0};
                    add(pos, node.offsetLeft, node.offsetTop);
                    //get offset, stop by boundary or boundary.offsetParent
                    while (op && op != boundary && op != boundary.offsetParent) {
                        add(pos, op.offsetLeft, op.offsetTop);
                        if (browser.kde || (browser.gek && !TTAG[op.nodeName]))
                            border(op, pos);
                        if (!fixed && getStyle(op, "position") == "fixed")
                            fixed = true;
                        if (op.nodeName != 'BODY')
                            keepNode = op.nodeName == 'BODY' ? keepNode : op;
                        op = op.offsetParent;
                    }

                    //get scroll offset, stop by boundary
                    while (parent && parent.nodeName && parent != boundary && !HTAG[parent.nodeName]) {
                        if (!_d.test(getStyle(parent, "display")))
                            add(pos, -parent.scrollLeft, -parent.scrollTop);
                        if (browser.gek && getStyle(parent, "overflow") != "visible")
                            border(parent, pos);
                        parent = parent.parentNode;
                    }
                    if ((browser.gek && getStyle(keepNode, "position") != "absolute"))
                        add(pos, -db.offsetLeft, -db.offsetTop);
                    if (fixed)
                        add(pos, dd.scrollLeft || db.scrollLeft || 0, dd.scrollTop || db.scrollTop || 0);
                }
                r = pos;
            }
            return r;
        },
//class and src
        hasClass: function (name) {
            var i, l, isReg = xui.isReg(name), arr = xui.Dom._getClass(this.get(0)).split(/\s+/);
            if (isReg) {
                for (i = 0, l = arr.length; i < l; i++) {
                    if (name.test(arr[i])) {
                        return true;
                    }
                }
            } else {
                return xui.arr.indexOf(arr, name + "") != -1;
            }
            return false;
        },
        addClass: function (name) {
            if (!name) return this;
            var arr, i, l, me = arguments.callee, reg = (me.reg || (me.reg = /\s+/)), t, ok,
                arr2 = (name + "").split(reg);
            if (!arr2.length) return this;

            return this.each(function (o) {
                ok = 0;
                arr = xui.Dom._getClass(o).split(reg);
                t = [];
                for (i = 0, l = arr.length; i < l; i++) if (arr[i]) t.push(arr[i]);
                for (i = 0, l = arr2.length; i < l; i++) {
                    if (arr2[i] && xui.arr.indexOf(arr, arr2[i]) == -1) {
                        ok = 1;
                        t.push(arr2[i]);
                    }
                }
                ;
                if (ok) xui.Dom._setClass(o, t.join(" "));
            });
        },
        removeClass: function (name) {
            var arr, i, l, isReg = xui.isReg(name), me = arguments.callee, reg = (me.reg || (me.reg = /\s+/)), ok,
                arr2;
            if (!isReg) {
                arr2 = (name + "").split(reg);
                if (!arr2.length) return this;
            }
            return this.each(function (o) {
                ok = 0;
                arr = xui.Dom._getClass(o).split(reg);
                if (!isReg) {
                    for (i = 0, l = arr2.length; i < l; i++) {
                        if (xui.arr.indexOf(arr, arr2[i]) != -1) {
                            ok = 1;
                            xui.arr.removeValue(arr, arr2[i]);
                        }
                    }
                } else {
                    xui.filter(arr, function (o, i) {
                        if (name.test(o)) {
                            ok = 1;
                            return false;
                        }
                    });
                }
                if (ok) xui.Dom._setClass(o, arr.join(" "));
            });
        },
        replaceClass: function (regexp, replace) {
            var n, r;
            return this.each(function (o) {
                r = (n = xui.Dom._getClass(o)).replace(regexp, replace);
                if (n != r) xui.Dom._setClass(o, r);
            });
        },
        tagClass: function (tag, isAdd) {
            var self = this,
                me = arguments.callee,
                r1 = me["_r1_" + tag] || (me["_r1_" + tag] = new RegExp("([-\\w]+" + tag + "[-\\w]*)")),
                r2 = me["_r2"] || (me["_r2"] = /([-\w]+)/g);
            self.removeClass(r1);
            isAdd = false !== isAdd;
            var r = isAdd ? self.replaceClass(r2, '$1 $1' + tag) : self;

            //fix for ie67
            if (xui.__iefix2 && (tag == "-checked" || tag == "-fold" || tag == "-expand")) {
                this.each(function (n) {
                    var arr = xui.Dom._getClass(n).split(/\s+/);
                    if (xui.arr.indexOf(arr, 'xuifont') != -1 || xui.arr.indexOf(arr, 'xuicon') != -1) {
                        xui.arr.each(arr, function (s) {
                            //It has 'xxxx' and 'xxxx-checked'
                            if (xui.__iefix2[s + (isAdd ? '' : tag)] && xui.__iefix2[isAdd ? s.replace(new RegExp(tag + '$'), '') : s]) {
                                xui(n).html(xui.__iefix2[s.replace(new RegExp(tag + '$'), '') + (isAdd ? tag : '')]);
                                return false;
                            }
                        });
                    }
                });
            }
            return r;
        },
//events:
        /*
        $addEvent('onClick',fun,'idforthisclick';)
        $addEvent([['onClick',fun,'idforthisclick'],[...]...])

        do:
            add onclick to dom
            append fun to xui.$cache.profileMap.id.events.onClick array
            append 'onclick' to xui.$cache.profileMap.id.add array
        */

        $addEventHandler: function (name) {
            var event = xui.Event,
                type,
                handler = event.$eventhandler;
            return this.each(function (o) {
                if (o.nodeType == 3) return;
                //set to purge map
                xui.setNodeData(o, ['eHandlers', 'on' + event._eventMap[name]], handler);

                //set to dom node
                if (type = event._eventHandler[name]) {
                    xui.setNodeData(o, ['eHandlers', type], handler);
                    event._addEventListener(o, event._eventMap[name], handler);

                    if (xui.browser.isTouch && type == 'onmousedown') {
                        xui.setNodeData(o, ['eHandlers', 'onxuitouchdown'], handler);
                        event._addEventListener(o, "xuitouchdown", handler);
                    }
                }
            });
        },
        /*
        'mousedown' -> 'dragbegin'
        'mouseover' -> 'dragenter'
        'mouseout' -> 'dragleave'
        'mouseup' -> 'drop'
        */
        $removeEventHandler: function (name) {
            var event = xui.Event,
                handler = event.$eventhandler,
                handler3 = event.$eventhandler3,
                type;
            return this.each(function (o) {
                //remove from dom node
                if (type = event._eventHandler[name]) {
                    event._removeEventListener(o, type, handler);
                    event._removeEventListener(o, type, handler3);

                    if (xui.browser.isTouch && type == 'onmousedown') {
                        event._removeEventListener(o, 'xuitouchdown', handler);
                    }
                }
                //remove from purge map
                if (o = xui.getNodeData(o, 'eHandlers')) {
                    type = 'on' + event._eventMap[name];
                    delete o[type];
                    if (xui.browser.isTouch && type == 'onmousedown') {
                        delete o['onxuitouchdown'];
                    }
                }
            });
        },
        $addEvent: function (name, fun, label, index) {
            var self = this,
                event = xui.Event,
                arv = xui.arr.removeValue,
                ari = xui.arr.insertAny,
                id, c, t, m;

            if (!index && index !== 0) index = -1;

            if (typeof label == 'string')
                label = "$" + label;
            else label = undefined;

            self.$addEventHandler(name).each(function (o) {
                if (o.nodeType == 3) return;

                if (!(id = event.getId(o)) && o !== window && o !== document)
                    id = o.id = xui.Dom._pickDomId();

                if (!(c = xui.$cache.profileMap[id]))
                    c = new xui.DomProfile(id);

                t = c.events || (c.events = {});
                m = t[name] || (t[name] = []);

                //if no label input, clear all, and add a single
                if (label === undefined) {
                    m.length = 0;
                    m = t[name] = [];
                    index = -1;
                    label = '_';
                }
                m[label] = fun;
                arv(m, label);
                if (index == -1) m[m.length] = label;
                else
                    ari(m, label, index);

                if (xui.Event && (c = xui.Event._getProfile(id)) && c.clearCache)
                    c.clearCache();
            });

            return self;
        },
        /*
        $removeEvent('onClick','idforthisclick')
        $removeEvent('onClick')
            will remove all onClick in xui.$cache.profileMap.id.events.
        $removeEvent('onClick',null,true)
            will remove all onClick/beforeClick/afterClick in xui.$cache.profileMap.id.events.
        */
        $removeEvent: function (name, label, bAll) {
            var self = this, c, t, k, id, i, type,
                event = xui.Event,
                dom = xui.$cache.profileMap,
                type = event._eventMap[name];

            self.each(function (o) {
                if (!(id = event.getId(o))) return;
                if (!(c = dom[id])) return;
                if (!(t = c.events)) return;
                if (bAll)
                    xui.arr.each(event._getEventName(type), function (o) {
                        delete t[o];
                    });
                else {
                    if (typeof label == 'string') {
                        label = '$' + label;
                        if (k = t[name]) {
                            delete k[label];
                            if (xui.arr.indexOf(k, label) != -1)
                                xui.arr.removeValue(k, label);
                        }
                    } else
                        delete t[name];
                }

                if (xui.Event && (c = xui.Event._getProfile(id)) && c.clearCache)
                    c.clearCache();
            });

            return self;
        },
        $getEvent: function (name, label) {
            var id;
            if (!(id = xui.Event.getId(this.get(0)))) return;

            if (label)
                return xui.get(xui.$cache.profileMap, [id, 'events', name, '$' + label]);
            else {
                var r = [], arr = xui.get(xui.$cache.profileMap, [id, 'events', name]);
                xui.arr.each(arr, function (o, i) {
                    r[r.length] = {o: arr[o]};
                });
                return r;
            }
        },
        $clearEvent: function () {
            return this.each(function (o, i) {
                var event = xui.Event,
                    handler = event.$eventhandler,
                    handler3 = event.$eventhandler3,
                    type;

                if (!(i = event.getId(o))) return;
                if (!(i = xui.$cache.profileMap[i])) return;
                if (i.events) {
                    xui.each(i.events, function (f, name) {
                        type = xui.Event._eventMap[name];
                        if (type) {
                            event._removeEventListener(o, type, handler);
                            event._removeEventListener(o, type, handler3);
                        }
                    });
                    xui.breakO(i.events, 2);
                    delete i.events;
                }
                xui.set(xui.$cache.domPurgeData, [o.$xid, 'eHandlers'], {});
            });
        },
        $fireEvent: function (name, args) {
            var type = xui.Event._eventMap[name],
                t, s = 'on' + type,
                handler,
                hash,
                me = arguments.callee,
                f = xui.Event.$eventhandler,
                f1 = me.f1 || (me.f1 = function () {
                    this.returnValue = false
                }),
                f2 = me.f2 || (me.f2 = function () {
                    this.cancelBubble = true
                });
            return this.each(function (o) {
                if (!(handler = xui.getNodeData(o, ['eHandlers', s]))) return;
                if ('blur' == type || 'focus' == type) {
                    try {
                        o[type]()
                    } catch (e) {
                    }
                } else {
                    hash = xui.copy(args);
                    xui.merge(hash, {
                        type: type,
                        target: o,
                        button: 1,
                        $xuievent: true,
                        $xuitype: name,
                        preventDefault: f1,
                        stopPropagation: f2
                    }, 'all');
                    handler.call(o, hash);
                }
            });
        },
        nativeEvent: function (name) {
            return this.each(function (o) {
                if (o.nodeType === 3 || o.nodeType === 8) return;
                try {
                    o[name]()
                } catch (e) {
                }
            });
        },

//functions
        $canFocus: function () {
            var me = arguments.callee, getStyle = xui.Dom.getStyle,
                map = me.map || (me.map = {a: 1, input: 1, select: 1, textarea: 1, button: 1, object: 1}), t, node;
            return !!(
                (node = this.get(0)) &&
                node.focus &&
                //IE bug: It can't be focused with 'default tabIndex 0'; but if you set it to 0, it can be focused.
                //So, for cross browser, don't set tabIndex to 0
                (((t = map[node.nodeName.toLowerCase()]) && !(parseInt(node.tabIndex, 10) <= -1)) || (!t && parseInt(node.tabIndex, 10) >= (xui.browser.ie ? 1 : 0))) &&
                getStyle(node, 'display') != 'none' &&
                getStyle(node, 'visibility') != 'hidden' &&
                node.offsetWidth > 0 &&
                node.offsetHeight > 0
            );
        },
        focus: function (force) {
            var ns = this;
            if (force || ns.$canFocus())
                try {
                    ns.get(0).focus()
                } catch (e) {
                }
            return ns;
        },
        blur: function () {
            var n = this.get(0);
            if (!n) return;
            n.blur();
            if (document.activeElement === n) {
                xui.asyRun(function () {
                    xui('body').append(n = xui.create("<button style='position:absolute;width:1px;height:1px;left:-1000px;'></button>"));
                    n.focus();
                    n.remove();
                });
            }
        },
        setSelectable: function (value) {
            var me = arguments.callee, cls;
            this.removeClass("xui-ui-selectable").removeClass("xui-ui-unselectable");
            this.addClass(value ? "xui-ui-selectable" : "xui-ui-unselectable");
            return this.each(function (o) {
                if (xui.browser.ie && xui.browser.ver < 10)
                    xui.setNodeData(o, "_onxuisel", value ? "true" : "false");
            })
        },
        contentBox: function (d) {
            return (xui.browser.ie || xui.browser.opr) ?
                !/BackCompat|QuirksMode/.test((d || document).compatMode) :
                (this.css("box-sizing") || this.css("-moz-box-sizing")) == "content-box";
        },
        setInlineBlock: function () {
            var ns = this;
            if (xui.browser.gek) {
                if (xui.browser.ver < 3)
                    ns.css('display', '-moz-inline-block').css('display', '-moz-inline-box').css('display', 'inline-block');
                else
                    ns.css('display', 'inline-block');
            } else if (xui.browser.ie && xui.browser.ver <= 6)
                ns.css('display', 'inline-block').css({display: 'inline', zoom: '1'});
            else
                ns.css('display', 'inline-block');
            return ns;
        },
        topZindex: function (flag) {
            //set the minimum to 1000
            var i = 1000, j = 0, k, node = this.get(0), p = node.offsetParent, t, o, style;
            if (xui.browser.ie && (!p || (p.nodeName + "").toUpperCase() == "HTML")) {
                p = xui("body").get(0);
            }
            if (node.nodeType != 1 || !p) return 1;

            t = p.childNodes;
            for (k = 0; o = t[k]; k++) {
                style = o.style;
                if (o == node || o.nodeType != 1 || !o.$xid || (style && style.display == 'none') || (style && style.visibility == 'hidden') || o.zIndexIgnore || xui.getNodeData(o, 'zIndexIgnore')) continue;
                j = parseInt(style && style.zIndex, 10) || 0;
                i = i > j ? i : j;
            }
            i++;
            if (i >= xui.Dom.TOP_ZINDEX)
                xui.Dom.TOP_ZINDEX = i + 1;

            if (flag)
                node.style.zIndex = i;
            else {
                j = parseInt(node.style.zIndex, 10) || 0;
                return i > j ? i : j;
            }
            return this;
        },
        /*
        dir:true for next, false for prev
        inn:true for include the inner node
        set:true for give focus
        */
        nextFocus: function (downwards, includeChild, setFocus, pattern) {
            downwards = xui.isBool(downwards) ? downwards : true;
            var self = this.get(0), node = this.$iterator('', downwards, includeChild, function (node) {
                return node !== self && (!pattern || (node.id && pattern.test(node.id))) && xui([node]).$canFocus()
            });
            if (!node.isEmpty() && setFocus !== false) node.focus();
            self = null;
            return node;
        },
        fullScreen: function (full) {
            var e = this.get(0), d = document;
            if (e) {
                if (e === d) e = d.documentElement;
                var requestMethod = full !== false ? (e.requestFullScreen || e.webkitRequestFullScreen || e.mozRequestFullScreen || e.msRequestFullScreen)
                    : (d.exitFullscreen || d.mozCancelFullScreen || d.webkitExitFullscreen || d.webkitExitFullscreen);
                if (requestMethod) {
                    requestMethod.call(full !== false ? e : d);
                } else if (typeof window.ActiveXObject !== "undefined") {
                    var wscript = new ActiveXObject("WScript.Shell");
                    if (wscript !== null) {
                        wscript.SendKeys("{F11}");
                    }
                }
            }
        },
        /*
        args:{
            width:[0,100],
            height:[0,100],
            left:[0,100]
            top:[0,100]
            opacity:[0,1],
            backgroundColor:['#ffffff','#000000']
            scrollTop:[0,100]
            scrollLeft:[0,100]
            fontSize:[12,18]
        }
        */
        animate: function (endpoints, onStart, onEnd, duration, step, type, threadid, unit, restore, times, _goback) {
            var self = this, f, map = {left: 1, top: 1, right: 1, bottom: 1, width: 1, height: 1},
                prf = xui.$cache.profileMap[self.id()],
                ctrl = prf ? prf['xui.DomProfile'] ? xui(prf) : prf.boxing() : null,
                css = xui.CSS,
                tween = xui.Dom.$AnimateEffects,
                _get = function (node, ctrl, key, t) {
                    return (map[key] && ctrl && xui.isFun(ctrl[t = 'get' + xui.str.initial(key)])) ? ctrl[t](key) : node[key] ? node[key]() : node.css(key);
                },
                _set = function (node, ctrl, key, value, t) {
                    return (map[key] && ctrl && xui.isFun(ctrl[t = 'set' + xui.str.initial(key)])) ? ctrl[t](value) : node[key] ? node[key](value) : node.css(key, value);
                },
                color = function (from, to, curvalue) {
                    if (typeof from != 'string' || typeof to != 'string') return '#fff';
                    if (curvalue < 0) return from;
                    if (curvalue > 1) return to;

                    var f, f1, f2, f3;
                    f = function (str) {
                        return (str.charAt(0) != '#') ? ('#' + str) : str;
                    };
                    from = f(from);
                    to = f(to);

                    f1 = function (str, i, j) {
                        return parseInt(str.slice(i, j), 16) || 0;
                    };
                    f2 = function (o) {
                        return {red: f1(o, 1, 3), green: f1(o, 3, 5), blue: f1(o, 5, 7)}
                    };
                    from = f2(from);
                    to = f2(to);

                    f3 = function (from, to, value, c) {
                        var r = from[c] + Math.round(parseFloat(value * (to[c] - from[c])) || 0);
                        return (r < 16 ? '0' : '') + r.toString(16)
                    };
                    return '#' + f3(from, to, curvalue, 'red') + f3(from, to, curvalue, 'green') + f3(from, to, curvalue, 'blue');
                };
            if (!endpoints) {
                if (onEnd) xui.tryF(onEnd);
                return;
            } else {
                // adjust endpoints
                xui.each(endpoints, function (o, i) {
                    if (!xui.isFun(o)) {
                        if (!xui.isArr(o) || o.length === 1) o = [_get(self, ctrl, i), o];
                        endpoints[i] = o;
                    }
                });
            }
            var parmsBak = endpoints;
            // clone it now
            endpoints = xui.clone(endpoints);

            // Estimate duration by steps
            if ((step || 0) > 0)
                duration = step * 16;
            else
                duration = duration || 200;
            times = times || 1;
            if ((type || "").indexOf('-') != -1) type = type.replace(/\-(\w)/g, function (a, b) {
                return b.toUpperCase()
            });
            type = (type in tween) ? type : 'circIn';

            var starttime, node = self.get(0), fun = function (tid) {
                var offtime = xui.stamp() - starttime, curvalue, u, eu, su, s, e;
                if (offtime >= duration) offtime = duration;
                xui.each(endpoints, function (o, i) {
                    curvalue = tween[type](duration, offtime);
                    if (typeof o == 'function') o.call(self, curvalue);
                    else {
                        s = o[0];
                        e = o[1];
                        u = o[2];
                        if (xui.str.endWith(i.toLowerCase(), 'color')) {
                            curvalue = color(s, e, curvalue);
                        } else {
                            if (!xui.isFinite(e)) {
                                u = e.replace(/[-\d.]*/, '');
                                eu = u || 'px';
                                if (!xui.isFinite(s)) {
                                    su = s.replace(/[-\d.]*/, '') || 'px';
                                    if (su != eu) {
                                        if (su == 'em' && eu == 'px') {
                                            s = css.$em2px(s, node);
                                        } else if (su == 'px' && eu == 'em') {
                                            s = css.$px2em(s, node);
                                        }
                                    }
                                }
                            }
                            s = parseFloat(s) || 0;
                            e = parseFloat(e) || 0;
                            curvalue = xui.toFixedNumber(s + (e - s) * curvalue, 6);
                        }
                        curvalue += u || unit || '';
                        _set(self, ctrl, i, curvalue)
                    }
                });
                if (offtime == duration) {
                    if (restore && !_goback) {
                        starttime = xui.stamp();
                        _goback = 1;
                        xui.each(endpoints, function (v, k) {
                            if (!xui.isFun(v)) {
                                k = v[0];
                                v[0] = v[1];
                                v[1] = k
                            }
                        });
                    } else {
                        if (times == -1 || times > 0) {
                            starttime = xui.stamp();
                            if (times > 0) times -= 1;
                            if (_goback) {
                                _goback = 0;
                                xui.each(endpoints, function (v, k) {
                                    if (!xui.isFun(v)) {
                                        k = v[0];
                                        v[0] = v[1];
                                        v[1] = k
                                    }
                                });
                            }
                        }
                    }
                    if (!times) {
                        xui.Thread.abort(tid, 'normal');
                    }
                    return false;
                }
            }, funs = [fun];

            var tid = xui.getNodeData(node, '_inthread');
            if (tid && xui.Thread.isAlive(tid)) {
                xui.Thread.abort(tid, 'force');
                xui.setNodeData(node, '_inthread', null);
            }
            var reset = xui.getNodeData(node, '_animationreset');
            if (typeof reset == "function") {
                reset();
                xui.setNodeData(node, '_animationreset', null);
            }
            // allow custom threadid, except existing one
            return xui.Thread((!threadid || xui.Thread.get(threadid)) ? xui.id() : threadid, funs, 0, null, function (tid) {
                xui.setNodeData(node, '_inthread', tid);
                starttime = xui.stamp();
                xui.setNodeData(node, '_animationreset', function () {
                    xui.merge(endpoints, parmsBak, 'all');
                    starttime = xui.stamp();
                    fun();
                });
                return xui.tryF(onStart, arguments, this);
            }, function (tid, flag) {
                //maybe destroyed
                if (node && node.$xid) {
                    xui.setNodeData(node, '_inthread', null);
                    xui.setNodeData(node, '_animationreset', null);
                }
                if ('force' != flag)
                    xui.tryF(onEnd, arguments, this);
            }, true);
        },
        pop: function (pos, type, parent, trigger, group) {
            var ns = this, id = xui.stamp() + ":" + ns.xid();
            ns.popToTop(pos, type || "outer", parent).setBlurTrigger(id, function () {
                if (typeof(trigger) == "function") xui.tryF(trigger);
                else ns.hide();
            });
            return id;
        },
        // pop to the top layer
        popToTop: function (pos, type, parent, callback, showEffects, ignoreEffects) {
            var region, target = this, t;
            parent = xui(parent);
            if (parent.isEmpty())
                parent = xui('body');

            //prepare
            target.css({
                position: 'absolute',
                left: xui.Dom.HIDE_VALUE,
                top: xui.Dom.HIDE_VALUE,
                display: 'block',
                zIndex: xui.Dom.TOP_ZINDEX++
            });

            //ensure show target on the top of the other elements with the same zindex
            //parent.get(0).appendChild(target.get(0));
            target.css({left: 0, top: 0, visibility: 'hidden', display: 'block'});
            parent.append(target);

            //show
            target.cssPos(xui.Dom.getPopPos(pos, type, target, parent)).css({visibility: 'visible'});

            showEffects = ignoreEffects ? null : showEffects ? showEffects : xui.get(xui.UIProfile.getFromDom(target), ['properties', 'showEffects']);
            if (showEffects) showEffects = xui.Dom._getEffects(showEffects, 1);
            if (showEffects) xui.Dom._vAnimate(target, showEffects, callback); else if (callback) callback();
            return this;
        },
        hoverPop: function (node, type, beforePop, beforeHide, parent, groupid, showEffects, hideEffects) {
            node = xui(node);
            if (showEffects) showEffects = xui.Dom._getEffects(showEffects, 1);
            if (hideEffects) hideEffects = xui.Dom._getEffects(hideEffects, 0);
            if (!xui.isDefined(type)) type = 'outer';

            var aysid = groupid || (this.xid() + ":" + node.xid()), self = this;
            this.onMouseover(type === null ? null : function (prf, e, src) {
                if (e.$force) return;
                xui.resetRun(aysid, null);
                var ignore = xui.getData([aysid, '$ui.hover.pop'])
                    && xui.getNodeData(node.get(0) || "empty", '$ui.hover.parent') == src;
                if (!ignore) {
                    xui.setData([aysid, '$ui.hover.pop'], 1);
                    xui.setNodeData(node.get(0) || "empty", '$ui.hover.parent', src);
                    if (!beforePop || false !== beforePop(prf, node, e, src)) {
                        node.popToTop(src, type, parent, showEffects);
                        node.onMouseover(function () {
                            self.onMouseover(true)
                        }, 'hoverPop').onMouseout(function () {
                            self.onMouseout(true)
                        }, 'hoverPop');
                    }
                }
            }, aysid).onMouseout(type === null ? null : function (prf, e, src) {
                if (e.$force) return;
                xui.resetRun(aysid, function () {
                    xui.setData([aysid, '$ui.hover.pop']);
                    xui.setNodeData(node.get(0) || "empty", '$ui.hover.parent', 0);
                    if (!beforeHide || false !== beforeHide(prf, node, e, src, 'host')) {
                        node.hide(null, hideEffects);
                        node.onMouseover(null, 'hoverPop').onMouseout(null, 'hoverPop');
                    }
                });
            }, aysid);
            if (node) {
                node.onMouseover(type === null ? null : function (e) {
                    if (e.$force) return;
                    xui.resetRun(aysid, null);
                }, aysid).onMouseout(type === null ? null : function (prf, e, src) {
                    if (e.$force) return;
                    xui.resetRun(aysid, function () {
                        xui.setData([aysid, '$ui.hover.pop']);
                        xui.setNodeData(node.get(0) || "empty", '$ui.hover.parent', 0);
                        if (!beforeHide || false !== beforeHide(prf, node, e, src, 'pop')) {
                            node.hide(null, hideEffects);
                            node.onMouseover(null, 'hoverPop').onMouseout(null, 'hoverPop');
                        }
                    });
                }, aysid);
            }
            node.css('display', 'none');
            return this;
        },
        //for remove obj when blur
        setBlurTrigger: function (id, trigger/*[false] for anti*/, group /*keep the original refrence*/,
                                  /*two inner params */ checkChild, triggerNext) {
            var ns = this,
                doc = document,
                sid = '$blur_triggers$',
                fun = xui.Dom._blurTrigger || (xui.Dom._blurTrigger = function (p, e) {
                    var p = xui.Event.getPos(e),
                        arr = arguments.callee.arr,
                        srcN = xui.Event.getSrc(e),
                        a = xui.copy(arr),
                        b, pos, w, h, v;
                    //filter first
                    xui.arr.each(a, function (i) {
                        b = true;
                        if (!(v = arr[i].target)) b = false;
                        else
                            v.each(function (o) {
                                if (o !== window && o !== document && !xui.Dom.byId(o.id))
                                    return b = false;
                            });
                        if (!b) {
                            delete arr[i];
                            xui.arr.removeValue(arr, i);
                        }
                        ;
                    });
                    a = xui.copy(arr);
                    xui.arr.each(a, function (i) {
                        v = arr[i];
                        if (!v) return;

                        b = true;
                        var isChild = function () {
                            var nds = v.target.get();
                            while (srcN && srcN.nodeName && srcN.nodeName != "BODY" && srcN.nodeName != "HTML") {
                                if (xui.arr.indexOf(nds, srcN) != -1)
                                    return true;
                                srcN = srcN.parentNode;
                            }
                        };
                        if (!v.checkChild || isChild()) {
                            v.target.each(function (o) {
                                if (o.parentNode && (w = o.offsetWidth) && (h = o.offsetHeight)) {
                                    pos = xui([o]).offset();
                                    if (p.left >= pos.left && p.top >= pos.top && p.left <= (pos.left + w) && p.top <= (pos.top + h)) {
                                        return b = false;
                                    }
                                }
                            });
                        }

                        isChild = null;

                        // anti trigger
                        if (!b && !xui.isFun(v.trigger))
                            return false;

                        if (b) {
                            delete arr[i];
                            xui.arr.removeValue(arr, i);
                            xui.tryF(v.trigger, [p, e], v.target);
                            v = null;
                        } else if (v.stopNext) {
                            //if the top layer popwnd cant be triggerred, prevent the other layer popwnd trigger
                            return false;
                        }
                    }, null, true);
                    srcN = null;
                    a.length = 0;
                }),
                arr = fun.arr || (fun.arr = []),
                target;

            // remove this trigger first
            if (arr[id]) {
                if (trigger === true) {
                    xui.tryF(arr[id].trigger);
                    trigger = false;
                }
                delete arr[id];
                xui.arr.removeValue(arr, id);
            }
            // add trigger
            if (trigger) {
                if (group) {
                    //keep the original refrence
                    if (group['xui.Dom'])
                        target = group;
                    else if (xui.isArr(group)) {
                        target = xui();
                        target._nodes = group;
                    }
                    target.merge(ns);
                } else {
                    target = ns;
                }

                target.each(function (o) {
                    if (!o.id && o !== window && o !== document) o.id = xui.Dom._pickDomId()
                });

                //double link
                arr[id] = {
                    trigger: trigger,
                    target: target,
                    checkChild: !!checkChild,
                    stopNext: !triggerNext
                };
                arr.push(id);

                if (!doc.onmousedown) doc.onmousedown = xui.Event.$eventhandler;
                doc = fun = null;
            }
            return this;
        },
        //for firefox disappeared cursor bug in input/textarea
        $firfox2: function () {
            if (!xui.browser.gek2) return this;
            var ns = this;
            ns.css('overflow', 'hidden');
            xui.asyRun(function () {
                ns.css('overflow', 'auto')
            });
            return ns;
        },
        //IE not trigger dimension change, when change height only in overflow=visible.
        ieRemedy: function () {
            if (xui.browser.ie && xui.browser.ver <= 6) {
                var a1 = this.get(), a2 = [], a3 = [], l = a1.length, style;
                //xui.asyRun(function(){
                for (var i = 0; i < l; i++) {
                    style = a1[i].style;
                    // allow once
                    if (!xui.isSet(a1[i].$ieRemedy)) {
                        if (xui.isSet(style.width)) {
                            a1[i].$ieRemedy = style.width;
                            style.width = ((xui.CSS.$px(a1[i].$ieRemedy, a1[i]) || 0) + 1) + "px";
                        }
                    }
                    /*
                        if((a3[i]=style.WordWrap)=='break-word')
                            style.WordWrap='normal';
                        else
                            style.WordWrap='break-word';
                        */
                }
                xui.asyRun(function () {
                    for (var i = 0; i < l; i++) {
                        if (xui.isSet(a1[i].$ieRemedy)) {
                            a1[i].style.width = a1[i].$ieRemedy;
                            a1[i].removeAttribute('$ieRemedy');
                        }
                        //a1[i].style.WordWrap=a3[i];
                    }
                    a1.length = a2.length = a3.length = 0;
                });
                // });
            }
            return this;
        }
        /*,
        gekRemedy:function(){
            if(xui.browser.gek)
                return this.each(function(o,i){
                    if(i=o.style){
                        var b=i.zIndex||0;
                        i.zIndex=++b;
                        i.zIndex=b;
                    }
                });
        }*/
    },
    Static: {
        HIDE_VALUE: '-10000px',
        TOP_ZINDEX: 10000,

        _boxArr: xui.toArr('width,height,left,top,right,bottom'),
        _cursor: {},

        _pickDomId: function () {
            var id;
            do {
                id = 'xui_' + xui.id()
            } while (document.getElementById(id))
            return id;
        },
        _map: {
            'html': 1,
            'head': 1,
            'body': 1
        },
        //for ie6
        fixPng: function (n) {
            if (xui.browser.ie && xui.browser.ver <= 6) {
                if (n.nodeName == 'IMG' && n.src.toLowerCase().search(/\.png$/) != -1) {
                    var style = n.style;
                    style.height = n.height;
                    style.width = n.width;
                    style.backgroundImage = "none";
                    var t = ((style.filter ? (style.filter + ",") : "") + "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, src=" + n.src + "', sizingMethod='image')").replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/[,\s]+/g, ', ');
                    if (xui.browser.ie8) style.msfilter = t;
                    style.filter = t;
                    n.src = xui.ini.img_bg;
                }
                var bgimg = n.currentStyle.backgroundImage || style.backgroundImage,
                    bgmatch = (bgimg || "").toLowerCase().match(/^url[("']+(.*\.png[^\)"']*)[\)"']+[^\)]*$/i);
                if (bgmatch) {
                    style.backgroundImage = "none";
                    var t = ((style.filter ? (style.filter + ",") : "") + "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, src=" + bgmatch[1] + "', sizingMethod='crop')").replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/[,\s]+/g, ', ');
                    if (xui.browser.ie8) style.msfilter = t;
                    style.filter = t;
                }
            }
        },
        _getTag: function (n) {
            return n ? n.$xid ? n.$xid : n.nodeType == 1 ? xui.$registerNode(n).$xid : 0 : 0
        },
        _ensureValues: function (obj) {
            var t, i, map = this._map, a = [],
                //can't be obj, or opera will crash
                arr = obj === window
                    ? ['!window']
                    : obj === document
                        ? ['!document']
                        : xui.isArr(obj)
                            ? obj
                            : (obj == '[object NodeList]' || obj == '[object HTMLCollection]')
                                ? xui.toArr(obj)
                                : obj['xui.Dom']
                                    ? obj._nodes
                                    : obj._toDomElems
                                        ? obj._toDomElems()
                                        : typeof obj == 'function'
                                            ? obj()
                                            : [obj];
            for (i = 0; i < arr.length; i++)
                if (t = !(t = arr[i])
                    ? 0
                    : t === window
                        ? '!window'
                        : t === document
                            ? '!document'
                            : (typeof t == 'string' || (t['xui.DomProfile'] && (t = t.domId)))
                                ? t.charAt(0) == '!'
                                    ? t
                                    : this._getTag(map[t] ? document.getElementsByTagName(t)[0] : document.getElementById(t))
                                : ((t = arr[i])['xui.UIProfile'] || t['xui.Template'])
                                    ? t.renderId ? t.renderId : (t.boxing().render() && t.renderId)
                                    : this._getTag(t)
                )
                    a[a.length] = t;
            return a.length <= 1 ? a : this._unique(a);
        },
        _getClass: function (o) {
            return (typeof o.className == "string" && o.className)
                || (typeof o.className.baseVal == "string" && o.className.baseVal)
                || (typeof o.getAttribute !== "undefined" && o.getAttribute("class"))
                || "";
        },
        _setClass: function (o, v) {
            if (typeof o.className == "string") {
                o.className = v;
            } else if (typeof o.className.baseVal == "string") {
                o.className.baseVal = v;
            } else if (typeof o.getAttribute != "undefined") {
                o.setAttribute(v);
            }
        },
        /*
        pos: {left:,top:} or dom element
        parent:parent node
        type:1,2,3,4
        */
        getPopPos: function (pos, type, target, parent) {
            var result = {left: 0, top: 0};
            if (!pos) {
                return result;
            } else if (xui.isEvent(pos)) {
                return xui.Event.getPos(pos);
            } else {
                var region, node, abspos, t, box;
                if ((parent = xui(parent)).isEmpty())
                    parent = xui('body');
                if (pos['xui.UI'] || pos['xui.UIProfile'] || pos['xui.Dom'] || pos.nodeType == 1 || typeof pos == 'string') {
                    if (typeof(type) != "function") {
                        type = (type || 12) + '';
                    }
                    node = xui(pos);
                    //base region
                    abspos = node.offset(null, parent);
                    region = {
                        left: abspos.left,
                        top: abspos.top,
                        width: node.offsetWidth(),
                        height: node.offsetHeight()
                    };
                } else {
                    if (typeof(type) != "function") {
                        type = type ? '3' : '0';
                    }
                    t = type == '0' ? 0 : 8;
                    region = pos.region || {
                        left: pos.left - t,
                        top: pos.top - t,
                        width: t * 2,
                        height: t * 2
                    };
                }


                //window edge
                t = (parent.get(0) === document.body || parent.get(0) === document || parent.get(0) === window) ? xui.win : parent;
                box = {};

                box.left = t.scrollLeft();
                box.top = t.scrollTop();
                box.width = t.width() + box.left;
                box.height = t.height() + box.top;

                if (t == xui.win && xui.ini.$zoomScale) {
                    for (var i in box)
                        box[i] /= xui.ini.$zoomScale;
                }

                /*
                    type:1
                        +------------------+    +------------------+
                        |        3         |    |        4         |
                        +--------------+---+    +---+--------------+
                        |              |            |              |
                        |              |            |              |
                        +--------------+---+    +---+--------------+
                        |        1         |    |        2         |
                        +------------------+    +------------------+
                    type:2
                                             +---+              +---+
                                             |   |              |   |
                    +---+--------------+---+ |   +--------------+   |
                    |   |              |   | | 3 |              | 4 |
                    | 2 |              | 1 | |   |              |   |
                    |   +--------------+   | +---+--------------+---+
                    |   |              |   |
                    +---+              +---+
                    type:3
                                             +---+              +---+
                                             | 3 |              | 4 |
                        +--------------+     +---+--------------+---+
                        |              |         |              |
                        |              |         |              |
                    +---+--------------+---+     +--------------+
                    | 2 |              | 1 |
                    +---+              +---+
                    type:4
                                         +------------------+
                                         | 3                |
                    +--------------+---+ |   +--------------+ +----+--------------+ +--------------+----+
                    |              |   | |   |              | |    |              | |              |    |
                    |              |   | |   |              | |    |              | |              |    |
                    +--------------+   | +---+--------------+ |    +--------------+ +--------------+    |
                    |                1 |                      |  2                | |               4   |
                    +------------------+                      +-------------------- +-------------------+
                */
                if (typeof(type) == 'function') {
                    result = type(region, box, target, t);
                } else {
                    //target size
                    var w = target ? target.offsetWidth() : 0,
                        h = target ? target.offsetHeight() : 0,
                        arr = type.split(/-/g);
                    if (arr.length == 2) {
                        var hp = arr[0], vp = arr[1];
                        switch (vp) {
                            case "outertop":
                                result.top = region.top - h;
                                break;
                            case "top":
                                result.top = region.top;
                                break;
                            case "middle":
                                result.top = region.top + region.height / 2 - h / 2;
                                break;
                            case "bottom":
                                result.top = region.top + region.height - h;
                                break;
                            default:
                                //case "outerbottom":
                                result.top = region.top + region.height;
                        }
                        switch (hp) {
                            case "outerleft":
                                result.left = region.left - w;
                                break;
                            case "left":
                                result.left = region.left;
                                break;
                            case "center":
                                result.left = region.left + region.width / 2 - w / 2;
                                break;
                            case "right":
                                result.left = region.left + region.width - w;
                                break;
                            default:
                                //case "outerright":
                                result.left = region.left + region.width;
                        }
                    } else {
                        if (type == "outer") type = "12";
                        else if (type == "inner") type = "4";

                        var adjust = function (type) {
                            var hi, wi;
                            switch (type) {
                                case '2':
                                    hi = true;
                                    wi = false;
                                    break;
                                case '3':
                                    hi = wi = false;
                                    break;
                                case '4':
                                    hi = wi = true;
                                    break;
                                default:
                                    //case '1':
                                    hi = false;
                                    wi = true;
                            }

                            if (hi) {
                                if (region.top + h < box.height)
                                    result.top = region.top;
                                else
                                    result.top = region.top + region.height - h;
                            } else {
                                if (region.top + region.height + h < box.height)
                                    result.top = region.top + region.height;
                                else
                                    result.top = region.top - h;
                            }
                            if (wi) {
                                if (region.left + w < box.width)
                                    result.left = region.left;
                                else
                                    result.left = region.left + region.width - w;
                            } else {
                                if (region.left + region.width + w < box.width)
                                    result.left = region.left + region.width;
                                else
                                    result.left = region.left - w;
                            }
                            //over right
                            if (result.left + w > box.width) result.left = box.width - w;
                            //over left
                            if (result.left < box.left) result.left = box.left;
                            //over bottom
                            if (result.top + h > box.height) result.top = box.height - h;
                            //over top
                            if (result.top < box.top) result.top = box.top;
                        };

                        if (type == '12') {
                            adjust('1');
                            if (result.top < region.top + region.height && result.top + h > region.top) adjust('2');
                        } else if (type == '21') {
                            adjust('2');
                            if (result.left < region.left + region.width && result.left + w > region.left) adjust('1');
                        } else {
                            adjust(type);
                        }
                    }
                }
                return result;
            }
        },
        _scrollBarSize: 0,
        getScrollBarSize: function (force) {
            var ns = this;
            if (force || !ns._scrollBarSize) {
                var div;
                xui('body').append(div = xui.create('<div style="width:50px;height:50px;visibility:hidden;position:absolute;margin:0;padding:0;left:-100%;top:-100%;overflow:scroll;"></div>'));
                ns._scrollBarSize = div.get(0).offsetWidth - div.get(0).clientWidth;
                div.remove();
            }
            return ns._scrollBarSize;
        },
        _dpi: 0,
        getDPI: function (force) {
            var ns = this;
            if (force || !ns._dpi) {
                var div;
                xui('body').append(div = xui.create('<div style="width:1in;height:1in;visibility:hidden;position:absolute;margin:0;padding:0;left:-100%;top:-100%;overflow:scroll;"></div>'));
                ns._dpi = div.get(0).offsetHeight;
                div.remove();
            }
            return ns._dpi;
        },
        getStyle: function (node, name, force) {
            if (!node || node.nodeType != 1) return '';
            if (name == "rotate") {
                return xui(node).rotate();
            }
            var ns = xui.Dom,
                css3prop = xui.Dom._css3prop,
                style = node.style,
                value, b;
            if (name == 'opacity' && (!ns.css3Support("opacity")) && xui.browser.ie)
                b = name = 'filter';

            value = style[name];
            if (force || !value || value === "initial") {
                var me = xui.Dom.getStyle, t,
                    brs = xui.browser,
                    map = me.map || (me.map = {'float': 1, 'cssFloat': 1, 'styleFloat': 1}),
                    c1 = me._c1 || (me._c1 = {}),
                    c2 = me._c2 || (me._c2 = {}),
                    c3 = me._c3 || (me._c3 = {}),
                    name = c1[name] || (c1[name] = name.replace(/\-(\w)/g, function (a, b) {
                        return b.toUpperCase()
                    })),
                    name2 = c2[name] || (c2[name] = name.replace(/([A-Z])/g, "-$1").toLowerCase()),
                    name3, name4;

                var n1 = name;
                if (n1.indexOf("border") === 0) {
                    n1 = n1.replace(/[-]?(left|top|right|bottom)/ig, '');
                }
                if (xui.arr.indexOf(css3prop, n1) != -1) {
                    if (!ns.css3Support(name)) {
                        return '';
                    } else {
                        if (name != "textShadow") {
                            name3 = brs.cssTag2 + name2.charAt(0).toUpperCase() + name2.substr(1);
                            name4 = brs.cssTag1 + name2;
                        }
                    }
                }

                if (map[name])
                    name = xui.browser.ie ? "styleFloat" : "cssFloat";
                //document.defaultView first, for opera 9.0
                value = ((t = document.defaultView) && t.getComputedStyle) ?
                    (t = t.getComputedStyle(node, null)) ?
                        (t.getPropertyValue(name2) || (name4 && t.getPropertyValue(name4)))
                        : ''
                    : node.currentStyle ?
                        (node.currentStyle[name] || node.currentStyle[name2] || (name3 && (node.currentStyle[name3] || node.currentStyle[name4])))
                        : ((style && (style[name] || (name3 && style[name3]))) || '');
                /*
                            if(xui.browser.opr){
                                var map2 = me.map2 || (me.map2={left:1,top:1,right:1,bottom:1});
                                if(map2[name] && (xui.Dom.getStyle(node,'position')=='static'))
                                    value = 'auto';
                            }
            */
            }
            // xui.CSS.$px is for IE678
            if (!b && xui.browser.ie678) {
                // INPUT/TEXTREA will always return % for font-size
                if ((name == 'fontSize' || name2 == 'font-size') && /%/.test(value) && node.parentNode) {
                    value = (node.parentNode.currentStyle[name] || node.parentNode.currentStyle[name2]) * (parseFloat(value) || 0);
                } else if (xui.CSS.$isEm(value)) {
                    value = xui.CSS.$px(value, node);
                    ;
                }
            }
            return b ? value ? (parseFloat(value.match(/alpha\(opacity=(.*)\)/)[1]) || 0) / 100 : 1 : (value || '');
        },
        $getBoundingClientRect: function (node, original) {
            var rect = node.getBoundingClientRect(), t;
            if (!original && (t = xui.ini.$transformScale))
                for (var i in rect)
                    rect[i] /= t;
            return rect;
        },
        $transformIE: function (node, value) {
            var style = node.style,
                t = (style.filter || "").replace(/progid\:DXImageTransform\.Microsoft\.Matrix\([^)]+\)/ig, "").replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
            if (xui.browser.ie8) style.msfilter = t;
            style.filter = t;
            style.marginTop = style.marginLeft = "";
            if (value) {
                var tmatrix = function () {
                    var current,
                        degRat = Math.PI / 180,
                        //create new matrix
                        matrix = function (m11, m12, m21, m22, dx, dy) {
                            var m = {};
                            m.m11 = xui.isSet(m11) ? parseFloat(m11) : 1;
                            m.m12 = xui.isSet(m12) ? parseFloat(m12) : 0;
                            m.m21 = xui.isSet(m21) ? parseFloat(m21) : 0;
                            m.m22 = xui.isSet(m22) ? parseFloat(m22) : 1;
                            m.dx = xui.isSet(dx) ? parseFloat(dx) : 0;
                            m.dy = xui.isSet(dy) ? parseFloat(dy) : 0;
                            return m;
                        },
                        //multiply matrices
                        multiply = function (newMatrix, currentMatrix) {
                            //modify transformation matrix
                            var m = {};
                            m.m11 = roundNumber(newMatrix.m11 * currentMatrix.m11 + newMatrix.m21 * currentMatrix.m12, 10);
                            m.m12 = roundNumber(newMatrix.m12 * currentMatrix.m11 + newMatrix.m22 * currentMatrix.m12, 10);
                            m.m21 = roundNumber(newMatrix.m11 * currentMatrix.m21 + newMatrix.m21 * currentMatrix.m22, 10);
                            m.m22 = roundNumber(newMatrix.m12 * currentMatrix.m21 + newMatrix.m22 * currentMatrix.m22, 10);
                            m.dx = roundNumber(currentMatrix.dx + newMatrix.dx, 10);
                            m.dy = roundNumber(currentMatrix.dy + newMatrix.dy, 10);
                            //return new transformation matrix
                            return m;
                        },
                        //convert degrees to radians
                        deg2rad = function (deg) {
                            return degRat * deg;
                        },
                        //format number
                        roundNumber = function (num, dec) {
                            var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
                            return result;
                        };

                    //rotate transformation
                    this.rotate = function (deg) {
                        var rad = xui.isSet(deg) ? parseFloat(deg2rad(parseFloat(deg))) : 0;
                        var m = matrix(Math.cos(rad), -Math.sin(rad), Math.sin(rad), Math.cos(rad), 0, 0);
                        current = multiply(m, current);
                    };
                    //translate transformations
                    this.translate = function (x, y) {
                        var m = matrix(1, 0, 0, 1, parseFloat(x), parseFloat(y));
                        current = multiply(m, current);
                    };
                    this.translateX = function (x) {
                        this.translate(x, 0);
                    };
                    this.translateY = function (y) {
                        this.translate(0, y);
                    };
                    //scaling transformations
                    this.scale = function (x, y) {
                        var m = matrix(xui.isSet(x) ? parseFloat(x) : 1, 0, 0, xui.isSet(y) ? parseFloat(y) : 1, 0, 0);
                        current = multiply(m, current);
                    };
                    this.scaleX = function (x) {
                        this.scale(x, 1);
                    };
                    this.scaleY = function (y) {
                        this.scale(1, y);
                    };
                    //skew transformations
                    this.skew = function (xAng, yAng) {
                        xAng = xui.isSet(xAng) ? parseFloat(deg2rad(parseFloat(xAng))) : 0;
                        yAng = xui.isSet(yAng) ? parseFloat(deg2rad(parseFloat(yAng))) : 0;
                        var m = matrix(1, Math.tan(xAng), Math.tan(yAng), 1, 0, 0);
                        current = multiply(m, current);
                    };
                    this.skewX = function (xAng) {
                        this.skew(xAng, 0);
                    };
                    this.skewY = function (yAng) {
                        this.skew(0, yAng);
                    };
                    //transformation matrix
                    this.matrix = function (m11, m12, m21, m22, dx, dy) {
                        current = multiply(matrix(m11, m12, m21, m22, dx, dy), current);
                    };
                    //return matrix
                    this.getMatrix = function () {
                        return current;
                    };
                    //return IE CSS matrix
                    this.getFilter = function () {
                        return "progid:DXImageTransform.Microsoft.Matrix(M11=" + current.m11 + ", M12=" + current.m12 + ", M21=" + current.m21 + ", M22=" + current.m22 + ", Dx=" + current.dx + ", Dy=" + current.dy + ", SizingMethod='auto expand')";
                    };
                    this.getX = function () {
                        return current.dx;
                    };
                    this.getY = function () {
                        return current.dy;
                    };
                    this.reset = function () {
                        current = matrix(1, 0, 0, 1, 0, 0);
                    };
                    this.reset();
                };
                var computeMatrix = function (transform) {
                    var m = new tmatrix();
                    //Split the webkit functions and loop through them
                    var functions = transform.match(/[A-z]+\([^\)]+/g) || [];
                    for (var k = 0; k < functions.length; k++) {
                        //Prepare the function name and its value
                        var arr = functions[k].split('('),
                            func = arr[0],
                            value = arr[1],
                            values;
                        //Now we rotate through the functions and add it to our matrix
                        switch (func) {
                            case 'rotate':
                                m.rotate(value);
                                break;
                            case 'scale':
                                values = value.split(',');
                                m.scale(values[0], values[1]);
                                break;
                            case 'scaleX':
                                m.scaleX(value);
                                break;
                            case 'scaleY':
                                m.scaleY(value);
                                break;
                            case 'skew':
                                values = value.split(',');
                                m.skew(values[0], values[1]);
                                break;
                            case 'skewX':
                                m.skewX(value);
                                break;
                            case 'skewY':
                                m.skewY(value);
                                break;
                            case 'translate':
                                values = value.split(',');
                                m.translate(values[0], values[1]);
                                break;
                            case 'translateX':
                                m.translateX(value);
                                break;
                            case 'translateY':
                                m.translateY(value);
                                break;
                        }
                    }
                    return m;
                };
                var matrix = computeMatrix(value);
                var ow = node.offsetWidth, oh = node.offsetHeight;
                var filter = matrix.getFilter();
//xui.echo(filter);
                var t = ((style.filter ? (style.filter + ",") : "") + filter).replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                if (xui.browser.ie8) style.msfilter = t;
                style.filter = t;
//xui.echo(t);

                // for fake case
                if (node.getBoundingClientRect) {
                    var transX = matrix.getX(),
                        transY = matrix.getY(),
                        rect = xui.Dom.$getBoundingClientRect(node),
                        w = rect.right - rect.left,
                        h = rect.bottom - rect.top;

                    style.marginLeft = Math.round(parseFloat((ow - w) / 2 + 10 + transX)) + 'px';
                    style.marginTop = Math.round(parseFloat((oh - h) / 2 + 10 + transY)) + 'px';
                }

                // fake
                style.transform = value;
            }
        },
        $textShadowIE: function (node, value, box) {
            var style = node.style;
            if (!value) {
                var f = function (s) {
                        return (s || "").replace(/progid\:DXImageTransform\.Microsoft\.(Chroma|DropShadow|Glow)\([^)]+\)/ig, "").replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                    },
                    s1 = style.filter;
                if (s1) {
                    if (xui.browser.ie8) style.msfilter = f(s1);
                    style.filter = f(s1);
                }
                if (!box)
                    style.backgroundColor = "";
            } else {
                var f = function (x, y, r, c) {
                        return (box ? "" : "progid:DXImageTransform.Microsoft.Chroma(Color=#cccccc) ")
                            + "progid:DXImageTransform.Microsoft.DropShadow(Color=" + c + ", OffX=" + x + ", OffY=" + y + ") "
                            + (parseFloat(r) > 0 ? "progid:DXImageTransform.Microsoft.Glow(Strength=" + r + ", Color=" + c + ")" : "");
                    },
                    r = value.match(/([\d\.-]+)px\s+([\d\.-]+)px(\s+([\d\.-]+)px)?(\s+([#\w]+))?/);
                if (r) {
                    var t = ((style.filter ? (style.filter + ",") : "") + f(r[1], r[2], r[4], r[6] || "#000000")).replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                    if (xui.browser.ie8) style.msfilter = t;
                    style.filter = t;
                    if (!box)
                        style.backgroundColor = "#C5C5C5";
                }
            }
        },
        /*
        *type:linear, or radial
        *orient:LT/T/RT/R/RB/B/LB/L, + C for radial
        *stops:{clr:, pos:, opacity:}
        *rate:0~1
        *shape: circle or ellipse, only for radial
        *size: farthest-corner..
        */
        $setGradients: function (node, value, xb) {
            xb = xb || xui.browser;
            var ns = this,
                ver = xb.ver,
                c16 = "0123456789ABCDEF",
                _toFF = function (n, b) {
                    n = parseInt(n * b, 10) || 0;
                    n = (n > 255 || n < 0) ? 0 : n;
                    return c16.charAt((n - n % 16) / 16) + c16.charAt(n % 16);
                },
                _to255 = function (s) {
                    s = s.split('');
                    return c16.indexOf(s[0].toUpperCase()) * 16 + c16.indexOf(s[1].toUpperCase());
                };
            window.btoa = window.btoa || function (text) {
                if (/([^\u0000-\u00ff])/.test(text)) return;
                var table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", i = 0, cur, prev,
                    byteNum, result = [];
                while (i < text.length) {
                    cur = text.charCodeAt(i);
                    byteNum = (i + 1) % 3;
                    switch (byteNum) {
                        case 1://first byte
                            result.push(table.charAt(cur >> 2));
                            break;
                        case 2: //second byte
                            result.push(table.charAt((prev & 3) << 4 | (cur >> 4)));
                            break;
                        case 0: //third byte
                            result.push(table.charAt((prev & 0x0f) << 2 | (cur >> 6)));
                            result.push(table.charAt(cur & 0x3f));
                            break;
                    }
                    prev = cur;
                    i++;
                }
                if (byteNum == 1) {
                    result.push(table.charAt((prev & 3) << 4));
                    result.push("==");
                } else if (byteNum == 2) {
                    result.push(table.charAt((prev & 0x0f) << 2));
                    result.push("=");
                }
                return result.join("");
            }
            var iecracker1 = function (node, orient, stops, shape, size, rate) {
                    var id = "xui.s-ie8gdfix";
                    if (!node || node.nodeType != 1 || !node.style) return;
                    var style = node.style,
                        tmp1 = ns.getStyle(node, 'overflow'),
                        tmp2 = ns.getStyle(node, 'display');
                    if (tmp1 != 'hidden' || (tmp2 != 'block' && tmp2 != 'relative')) return;

                    if (!orient) {
                        var i, a = node.childNodes, l = a.length;
                        for (i = 0; i < l; i++) {
                            if (a[i].nodeType == 1 && a[i].id == id) {
                                node.removeChild(a[i]);
                                break;
                            }
                        }
                        style.backgroundColor = '';
                        var t = ((style.filter || "").replace(/progid\:DXImageTransform\.Microsoft\.Alpha\([^)]+\)/ig, '')).replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                        if (xui.browser.ie8) style.msfilter = t;
                        style.filter = t;
                    } else {
                        rate = rate || 1;

                        var innerColor = stops[0].clr,
                            outerColor = stops[stops.length - 1].clr;

                        var ew = node.offsetWidth || 0,
                            eh = node.offsetHeight || 0,
                            aw = ew * rate * 2,
                            ah = eh * rate * 2;

                        if (shape == 'circle')
                            aw = ah = Math.min(aw, ah);

                        var l = -aw / 2, t = -ah / 2, w = aw, h = ah;
                        if (xui.isObj(orient)) {
                            l = orient.left || (Math.round(parseFloat(l) || 0) + 'px');
                            t = orient.top || (Math.round(parseFloat(t) || 0) + 'px');
                        } else {
                            switch (orient) {
                                case 'LT':
                                    l = -aw / 2;
                                    t = -ah / 2;
                                    break;
                                case 'T':
                                    l = (ew - aw) / 2;
                                    t = -ah / 2;
                                    break;
                                case 'RT':
                                    l = ew - aw / 2;
                                    t = -ah / 2;
                                    break;
                                case 'L':
                                    l = -aw / 2;
                                    t = (eh - ah) / 2;
                                    break;
                                case 'C':
                                    l = (ew - aw) / 2;
                                    t = (eh - ah) / 2;
                                    break;
                                case 'R':
                                    l = ew - aw / 2;
                                    t = (eh - ah) / 2;
                                    break;
                                case 'LB':
                                    l = -aw / 2;
                                    t = eh - ah / 2;
                                    break;
                                case 'B':
                                    l = (ew - aw) / 2;
                                    t = eh - ah / 2;
                                    break;
                                case 'RB':
                                    l = ew - aw / 2;
                                    t = eh - ah / 2;
                                    break;
                            }
                            l += 'px';
                            t += 'px';
                        }

                        var at = document.createElement('div'),
                            s = at.style;
                        at.id = id;
                        s.position = 'absolute';
                        s.zIndex = '0';
                        s.top = t;
                        s.left = l;
                        s.width = Math.round(parseFloat(w) || 0) + 'px';
                        s.height = Math.round(parseFloat(h) || 0) + 'px';
                        s.backgroundColor = innerColor;

                        var starto = stops[0].opacity ? parseFloat(stops[0].opacity) * 100 : 100
                        var t = ((s.filter ? (s.filter + ",") : "") + 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + starto + ', finishopacity=0, style=2)').replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                        if (xui.browser.ie8) s.msfilter = t;
                        s.filter = t;

                        // the first node
                        if (node.firstChild)
                            node.insertBefore(at, node.firstChild);
                        else
                            node.appendChild(at);
                        style.backgroundColor = outerColor;
                        if (stops[stops.length - 1].opacity) {
                            var t = ((style.filter ? (style.filter + ",") : "") + "progid:DXImageTransform.Microsoft.Alpha(opacity=" + (parseFloat(stops[stops.length - 1].opacity) * 100) + ")").replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                            if (xui.browser.ie8) style.msfilter = t;
                            style.filter = t;
                        }
                    }
                },
                iecracker21 = function (node, orient, stops) {
                    var id = "xui.s-ie8gdfix";
                    if (!node || node.nodeType != 1 || !node.style) return;
                    var style = node.style,
                        tmp1 = ns.getStyle(node, 'overflow'),
                        tmp2 = ns.getStyle(node, 'display');
                    if (tmp1 != 'hidden') {
                        ns.setStyle(node, 'overflow', 'hidden');
                    }
                    if (tmp2 != 'block' && tmp2 != 'relative') {
                        ns.setStyle(node, 'display', 'relative');
                    }

                    if (!orient) {
                        var i, a = node.childNodes, l = a.length;
                        for (i = 0; i < l; i++) {
                            if (a[i].nodeType == 1 && a[i].id == id) {
                                node.removeChild(a[i]);
                                break;
                            }
                        }
                        style.backgroundColor = '';
                        var t = (style.filter || "").replace(/progid\:DXImageTransform\.Microsoft\.Alpha\([^)]+\)/ig, '').replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                        if (xui.browser.ie8) style.msfilter = t;
                        style.filter = t;
                    } else {
                        var innerColor = stops[0].clr,
                            outerColor = stops[stops.length - 1].clr;

                        var ew = node.offsetWidth || 0,
                            eh = node.offsetHeight || 0,
                            size = Math.min(ew, eh),
                            xs = 0, xe = size, ys = 0, ye = size;

                        switch (orient) {
                            case 'LT':
                                xs = 0;
                                ys = 0;
                                xe = size;
                                ye = size;
                                break;
//                      case 'T':
//                      xs=0;ys=0;xe=0;ye=size;
//                      break;
                            case 'RT':
                                xs = size;
                                ys = 0;
                                xe = 0;
                                ye = size;
                                break;
//                      case 'L':
//                      xs=0;ys=0;xe=0;ye=size;
//                      break;
//                      case 'R':
//                      xs=size;ys=0;xe=0;ye=0;
//                      break;
                            case 'LB':
                                xs = 0;
                                ys = size;
                                xe = size;
                                ye = 0;
                                break;
//                      case 'B':
//                      xs=0;ys=size;xe=0;ye=0;
//                      break;
                            case 'RB':
                                xs = size;
                                ys = size;
                                xe = 0;
                                ye = 0;
                                break;
                        }

                        var at = document.createElement('div'),
                            s = at.style;
                        at.id = id;
                        s.position = 'absolute';
                        s.zIndex = '0';
                        s.top = 0;
                        s.left = 0;
                        s.width = ew;
                        s.height = eh;
                        s.backgroundColor = innerColor;

                        var starto = stops[0].opacity ? parseFloat(stops[0].opacity) * 100 : 100
                        var t = ((s.filter ? (s.filter + ",") : "") + 'progid:DXImageTransform.Microsoft.Alpha(style=1, opacity=' + starto + ', finishopacity=0, startX=' + xs + ',finishX=' + xe + ',startY=' + ys + ',finishY=' + ye + ')').replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                        if (xui.browser.ie8) s.msfilter = t;
                        s.filter = t;

                        // the first node
                        if (node.firstChild)
                            node.insertBefore(at, node.firstChild);
                        else
                            node.appendChild(at);
                        style.backgroundColor = outerColor;
                        if (stops[stops.length - 1].opacity) {
                            var t = ((style.filter ? (style.filter + ",") : "") + "progid:DXImageTransform.Microsoft.Alpha(opacity=" + (parseFloat(stops[stops.length - 1].opacity) * 100) + ")").replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                            if (xui.browser.ie8) style.msfilter = t;
                            style.filter = t;
                        }
                    }
                },
                iecracker2 = function (node, orient, stops) {
                    var id = "xui.s-ie8gdfix";
                    if (!node || node.nodeType != 1 || !node.style) return;
                    var style = node.style;
                    if (!orient) {
                        var t = ((style.filter || "").replace(/progid\:DXImageTransform\.Microsoft\.Gradient\([^)]+\)/ig, '')).replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                        if (xui.browser.ie8) style.msfilter = t;
                        style.filter = t;
                        var i, a = node.childNodes, l = a.length;
                        for (i = 0; i < l; i++) {
                            if (a[i].nodeType == 1 && a[i].id == id) {
                                node.removeChild(a[i]);
                                break;
                            }
                        }
                        style.backgroundColor = '';
                        var t = ((style.filter || "").replace(/progid\:DXImageTransform\.Microsoft\.Alpha\([^)]+\)/ig, '')).replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                        if (xui.browser.ie8) style.msfilter = t;
                        style.filter = t;
                    } else {
                        var innerColor = stops[0].clr,
                            outerColor = stops[stops.length - 1].clr,
                            ori = 1, t;
                        if (stops[0].opacity)
                            innerColor = innerColor.replace('#', '#' + _toFF(stops[0].opacity, 255));
                        if (stops[stops.length - 1].opacity)
                            outerColor = outerColor.replace('#', '#' + _toFF(stops[stops.length - 1].opacity, 255));
                        switch (orient) {
                            case 'LT':
                            case 'RT':
                            case 'LB':
                            case 'RB':
                                iecracker21(node, orient, stops);
                                return;
                            case "L":
                                ori = 1;
                                break;
                            case "R":
                                ori = 1;
                                t = innerColor;
                                innerColor = outerColor;
                                outerColor = t;
                                break;
                            case "T":
                                ori = 0;
                                break;
                            case "B":
                                ori = 0;
                                t = innerColor;
                                innerColor = outerColor;
                                outerColor = t;
                                break;
                        }
                        var t = ((style.filter ? (style.filter + ",") : "") + "progid:DXImageTransform.Microsoft.Gradient(StartColorstr='" + innerColor + "',EndColorstr='" + outerColor + "',GradientType=" + ori + ")").replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                        if (xui.browser.ie8) style.msfilter = t;
                        style.filter = t;
                    }
                },
                svgcracker1 = function (node, orient, stops, shape, size, rate) {
                    if (!orient) {
                        node.style.backgroundImage = "";
                    } else {
                        rate = rate || 1;
                        var id = 'svg:' + xui.id(),
                            cx = '0%', cy = '0%',
                            r = rate * 100 + "%";
                        if (xui.isObj(orient)) {
                            cx = orient.left || cx;
                            cy = orient.left || cy;
                        } else {
                            switch (orient) {
                                case "T":
                                    cx = '50%';
                                    cy = '0%';
                                    break;
                                case "B":
                                    cx = '50%';
                                    cy = '100%';
                                    break;
                                case "L":
                                    cx = '0%';
                                    cy = '50%';
                                    break;
                                case "R":
                                    cx = '100%';
                                    cy = '50%';
                                    break;
                                case "LT":
                                    cx = '0%';
                                    cy = '0%';
                                    break;
                                case "RT":
                                    cx = '100%';
                                    cy = '0%';
                                    break;
                                case "RB":
                                    cx = '100%';
                                    cy = '100%';
                                    break;
                                case "LB":
                                    cx = '0%';
                                    cy = '100%';
                                    break;
                                case "C":
                                    cx = '50%';
                                    cy = '50%';
                                    break;
                            }
                        }
                        /*                    var rectw=1,recth=1;
                                        if(shape=='circle'){
                                            var m=Math.min(node.offsetWidth,node.offsetHeight);
                                            if(m==node.offsetWidth){
                                                recth=m/node.offsetHeight;
                                            }else{
                                                rectw=m/node.offsetWidth;
                                            }
                                        }
                    */
                        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">'
                            + '<radialGradient id="' + id + '" gradientUnits="userSpaceOnUse" cx="' + cx + '" cy="' + cy + '" r="' + r + '">';

                        for (var i = 0, l = stops.length; i < l; i++) {
                            svg += '<stop stop-color="' + stops[i].clr + '" offset="' + stops[i].pos + '" ' + (xui.isSet(stops[i].opacity) ? (' stop-opacity="' + stops[i].opacity + '"') : '') + ' />';
                        }

                        svg += '</radialGradient>'
                            + '<rect x="-50" y="-50" width="101" height="101" fill="url(#' + id + ')" />'
                            + '</svg>';

                        node.style.backgroundImage = 'url("data:image/svg+xml;base64,' + window.btoa(svg) + '")';
                    }
                },
                svgcracker2 = function (node, orient, stops) {
                    if (!orient) {
                        node.style.backgroundImage = '';
                    } else {
                        var id = 'svg' + xui.id(), x1 = '0%', y1 = '0%', x2 = '0%', y2 = '100%';

                        switch (orient) {
                            case "T":
                                x1 = '50%';
                                y1 = '0%';
                                x2 = '50%';
                                y2 = '100%';
                                break;
                            case "B":
                                x1 = '50%';
                                y1 = '100%';
                                x2 = '50%';
                                y2 = '0%';
                                break;
                            case "L":
                                x1 = '0%';
                                y1 = '50%';
                                x2 = '100%';
                                y2 = '50%';
                                break;
                            case "R":
                                x1 = '100%';
                                y1 = '50%';
                                x2 = '0%';
                                y2 = '50%';
                                break;
                            case "LT":
                                x1 = '0%';
                                y1 = '0%';
                                x2 = '100%';
                                y2 = '100%';
                                break;
                            case "RT":
                                x1 = '100%';
                                y1 = '0%';
                                x2 = '0%';
                                y2 = '100%';
                                break;
                            case "RB":
                                x2 = '0%';
                                y2 = '0%';
                                x1 = '100%';
                                y1 = '100%';
                                break;
                            case "LB":
                                x1 = '0%';
                                y1 = '100%';
                                x2 = '100%';
                                y2 = '0%';
                                break;
                            default:
                            /*To caculate x1/x2/y1/y2 from orient*/
                        }

                        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 1 1" preserveAspectRatio="none">'
                            + '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">';

                        for (var i = 0, l = stops.length; i < l; i++) {
                            svg += '<stop stop-color="' + stops[i].clr + '" offset="' + stops[i].pos + '" ' + (xui.isSet(stops[i].opacity) ? (' stop-opacity="' + stops[i].opacity + '"') : '') + '/>';
                        }

                        svg += '</linearGradient>'
                            + '<rect x="0" y="0" width="1" height="1" fill="url(#' + id + ')" />'
                            + '</svg>';

                        node.style.backgroundImage = 'url("data:image/svg+xml;base64,' + window.btoa(svg) + '")';
                    }
                },
                css1 = function (node, orient, stops, shape, size, rate) {
                    var arr1 = [], arr2 = [], style = node.style;
                    xui.arr.each(stops, function (o) {
                        var clr = o.clr;
                        if (xui.isSet(o.opacity) && clr.charAt(0) == '#') {
                            clr = clr.slice(1);
                            clr = "rgba(" + _to255(clr.substr(0, 2)) + "," + _to255(clr.substr(2, 2)) + "," + _to255(clr.substr(4, 2)) + "," + (parseFloat(o.opacity) || 1) + ")";
                        }
                        arr1.push(clr + " " + o.pos);
                        if (xb.isWebKit) {
                            arr2.push("color-stop(" + o.pos + ',' + clr + ")");
                        }
                    });

                    if (!orient) {
                        style.backgroundImage = "";
                    } else {
                        var position;
                        if (xui.isObj(orient)) {
                            position = orient.left + " " + orient.top;
                        } else {
                            switch (orient) {
                                case 'LT':
                                    position = 'left top';
                                    break;
                                case 'T':
                                    position = 'center top';
                                    break;
                                case 'RT':
                                    position = 'right top';
                                    break;
                                case 'L':
                                    position = 'left center';
                                    break;
                                case 'C':
                                    position = 'center center';
                                    break;
                                case 'R':
                                    position = 'right center';
                                    break;
                                case 'LB':
                                    position = 'left bottom';
                                    break;
                                case 'B':
                                    position = 'center bottom';
                                    break;
                                case 'RB':
                                    position = 'right bottom';
                                    break;
                                default:
                                    position = 'left top';
                            }
                        }

                        if (xb.isWebKit) {
                            style.backgroundImage = "-webkit-gradient(radial," + position + ", 0px, " + position + ", 100%," + arr2.join(",") + ")";
                        }

                        var v1 = "radial-gradient(" + position + "," + shape + " " + size + "," + arr1.join(",") + ")";
                        if (xb.cssTag1) {
                            style.backgroundImage = xb.cssTag1 + v1;
                        }
                        style.backgroundImage = "radial-gradient(" + size + " " + shape + " at " + position + "," + arr1.join(",") + ")";
                    }
                },
                css2 = function (node, orient, stops) {
                    var arr1 = [], arr2 = [], style = node.style;
                    xui.arr.each(stops, function (o) {
                        var clr = o.clr;
                        if (xui.isSet(o.opacity) && clr.charAt(0) == '#') {
                            clr = clr.slice(1);
                            clr = "rgba(" + _to255(clr.substr(0, 2)) + "," + _to255(clr.substr(2, 2)) + "," + _to255(clr.substr(4, 2)) + "," + (parseFloat(o.opacity) || 1) + ")";
                        }
                        arr1.push(clr + " " + o.pos);
                        if (xb.isWebKit) {
                            arr2.push("color-stop(" + o.pos + ',' + clr + ")");
                        }
                    });

                    if (!orient) {
                        style.backgroundImage = "";
                    } else {
                        var direction = 'to bottom';
                        var directionmoz = "top";
                        var directionwebkit = 'left top, left bottom';
                        switch (orient) {
                            case 'LT':
                                direction = "135deg";
                                directionmoz = "-45deg";
                                directionwebkit = 'left top, right bottom';
                                break;
                            case 'T':
                                direction = "to bottom";
                                directionmoz = "top";
                                directionwebkit = 'left top, left bottom';
                                break;
                            case 'RT':
                                direction = directionmoz = "-135deg";
                                directionwebkit = 'right top, left bottom';
                                break;
                            case 'L':
                                direction = "to right";
                                directionmoz = "left";
                                directionwebkit = 'left top, right top';
                                break;
                            case 'R':
                                direction = "to left";
                                directionmoz = "right";
                                directionwebkit = 'right top, left top';
                                break;
                            case 'LB':
                                direction = directionmoz = "45deg";
                                directionwebkit = 'left bottom, right top';
                                break;
                            case 'B':
                                direction = "to top";
                                directionmoz = "bottom";
                                directionwebkit = 'left bottom, left top';
                                break;
                            case 'RB':
                                direction = "-45deg";
                                directionmoz = "135deg";
                                directionwebkit = 'right bottom, left top';
                                break;
                            default:
                                direction = orient;
                                directionmoz = orient;
                                directionwebkit = 'left top, right bottom';
                        }

                        if (xb.isWebKit) {
                            style.backgroundImage = "-webkit-gradient(linear," + directionwebkit + ", " + arr2.join(",") + ")";
                        }

                        var v1 = "linear-gradient({#}," + arr1.join(",") + ")";
                        if (xb.cssTag1) {
                            style.backgroundImage = xb.cssTag1 + v1.replace("{#}", directionmoz);
                        }
                        style.backgroundImage = v1.replace("{#}", direction);
                    }
                };

            var type = value ? (value.type || value || 'linear').toLowerCase() : null,
                rate = value ? (value.rate || 1) : null,
                shape = value ? (value.shape || 'circle').toLowerCase() : null,
                size = value ? (value.size || 'farthest-corner').toLowerCase() : null,
                orient = value ? value.orient : null,
                stops = value ? value.stops : null;

            if (type != 'linear')
                type = 'radial';

            if (stops) {
                if (stops.length > 1) {
                    xui.arr.stableSort(stops, function (x, y) {
                        x = parseFloat(x.pos) || 0;
                        y = parseFloat(y.pos) || 0;
                        return x > y ? 1 : x == y ? 0 : -1;
                    });
                } else {
                    return;
                }
            }

            if (xb.ie678) {
                if (type == 'linear') {
                    iecracker2(node, orient, stops);
                }
                else {
                    iecracker1(node, orient, stops, shape, size, rate);
                }
            }
            if (xb.ie9 || (xb.opr && ver < 11.1)) {
                if (type == 'linear') {
                    svgcracker2(node, orient, stops);
                }
                else {
                    svgcracker1(node, orient, stops, shape, size, rate);
                }
            }
            if (((xb.gek && ver >= 3.6)
                || (xb.isChrome && ver >= 10)
                || (xb.isSafari && ver >= 5.1)
                || (xb.ie && ver >= 10)
                || (xb.opr && ver >= 11.1)
            )) {
                if (type == 'linear') {
                    css2(node, orient, stops);
                } else {
                    if (xb.opr && ver < 12)
                        svgcracker1(node, orient, stops, shape, size, rate);
                    else
                        css1(node, orient, stops, shape, size, rate);
                }
            }
        },
        $setZoom: function (node, scale, transx, transy, origin) {
            scale = parseFloat(scale);
            if (xui.isNaN(scale) || scale <= 0) scale = '';
            var b = xui.browser, h = {};
            h[b.cssTag1 + "transform"] = h.transform = scale === '' ? '' : ((xui.isNumb(transx) && xui.isNumb(transy) ? ('translate(' + transx + 'px,' + transy + 'px) ') : '') + 'scale(' + scale + ',' + scale + ')');
            h[b.cssTag1 + "transform-origin"] = h["transform-origin"] = scale === '' ? '' : (origin || '0 0 0');
            xui(node).css(h);
        },
        _vAnimate: function (node, setting, callback) {
            if (!setting || !setting.endpoints || xui.isEmpty(setting.endpoints)) {
                if (callback) xui.tryF(callback);
                return;
            }

            var endpoints = setting.endpoints, begin = {}, end = {};
            node = xui(node);
            xui.each(endpoints, function (o, i) {
                if (!xui.isFun(o)) {
                    begin[i] = o[0];
                    end[i] = o[1]
                }
            });

            return node.animate(endpoints, function (threadid) {
                node.css(begin);
            }, function (threadid) {
                node.css(end);
                if (callback) xui.tryF(callback);
            }, setting.duration, 0, setting.type).start();
        },
        $adjustCss: function (hash, returnStr) {
            var fack = {nodeType: 1, style: {}}, style = fack.style;
            xui.Dom.setStyle(fack, hash);
            if (returnStr) {
                var arr = [];
                if (xui.browser.ie && xui.browser.ver == 8) {
                    if (style.filter)
                        style["-ms-filter"] = style.filter;
                    if (style['background-image'] == 'none')
                        style['background-image'] = "url(about:blank)";
                }
                xui.each(style, function (o, i) {
                    arr.push(i.replace(/([A-Z])/g, "-$1").toLowerCase() + ":" + o);
                });
                return arr.join(';').replace(/[;]+/g, ';');
            } else {
                return style;
            }
        },
        _cssfake: {rotate: 1, scaleX: 1, scaleY: 1, translateX: 1, translateY: 1, skewX: 1, skewY: 1},
        setStyle: function (node, name, value) {
            if (name == "rotate") {
                xui(node).rotate(value);
                return this;
            }
            var ns = xui.Dom,
                css3prop = xui.Dom._css3prop,
                xb = xui.browser,
                fake = ns._cssfake,
                style = node.style;

            if (node.nodeType != 1) return;
            if (typeof name == 'string') {
                if (fake[name]) {
                    xui(node)[name](value);
                } else {
                    var me = this.getStyle,
                        c1 = me._c1 || (me._c1 = {}),
                        r1 = me._r1 || (me._r1 = /alpha\([^\)]*\)/ig),
                        map = me.map || (me.map = {'float': 1, 'cssFloat': 1, 'styleFloat': 1});
                    var name2, name3, name4;
                    name = c1[name] || (c1[name] = name.replace(/\-(\w)/g, function (a, b) {
                        return b.toUpperCase()
                    }));

                    var n1 = name;
                    if (n1.indexOf("border") === 0) {
                        n1 = n1.replace(/[-]?(left|top|right|bottom)/ig, '');
                    }

                    if (name == "$gradient") {
                        return ns.$setGradients(node, value);
                    }
                    if (name == "$zoom") {
                        return ns.$setZoom(node, value);
                    } else if (name == 'opacity') {
                        value = xui.isFinite(value) ?
                            parseFloat(value) > 1 ?
                                1
                                : parseFloat(value) <= 0 ?
                                0
                                : parseFloat(value)
                            : 1;
                        value = value > 0.9999 ? '' : value;
                        if ((!ns.css3Support("opacity")) && xb.ie) {
                            if (value === '') value = 1;
                            // fake
                            style.opacity = value;
                            style.zoom = 1;
                            value = "alpha(opacity=" + 100 * value + ")";
                            var ov = (style.filter || "").replace(r1, "");
                            value = (ov ? (ov + ",") : "") + value;
                            name = "filter";
                            if (xb.ver == 8) name2 = "msfilter";
                        }
                    } else if (xui.arr.indexOf(css3prop, n1) != -1) {
                        if (!ns.css3Support(name)) {
                            if (xb.ie && xb.ver < 9) {
                                switch (name) {
                                    case "transform":
                                        xui.Dom.$transformIE(node, value);
                                        break;
                                    case "boxShadow":
                                        xui.Dom.$textShadowIE(node, value, true);
                                        break;
                                }
                            }
                            if (name == "textShadow" && xb.ie && xb.ver < 10) {
                                xui.Dom.$textShadowIE(node, value);
                            }
                            return this;
                        } else {
                            if (xb.cssTag2) {
                                if (name != "textShadow") {
                                    name2 = xb.cssTag2 + name.charAt(0).toUpperCase() + name.substr(1);
                                }
                            }
                        }
                    } else if (map[name]) {
                        name = xb.ie ? "styleFloat" : "cssFloat";
                    }

                    if (name == "filter") {
                        value = value.replace(/(^[\s,]*)|([\s,]*$)/g, '').replace(/,[\s]+/g, ',' + (xui.browser.ver == 8 ? "" : " "));
                    }
                    style[name] = value;
                    if (name2) style[name2] = value;
                    if (name3) style[name3] = value;
                    if (name4) style[name4] = value;
                }
            } else
                for (var i in name)
                    arguments.callee.call(this, node, i, name[i]);
        },
        _css3prop: 'opacity,textShadow,animationName,columnCount,flexWrap,boxDirection,backgroundSize,perspective,boxShadow,borderImage,borderRadius,boxReflect,transform,transition'.split(','),
        css3Support: function (key) {
            var self = arguments.callee,
                _c = self._c || (self._c = {});

            key = key.replace("$", "").replace(/\-(\w)/g, function (a, b) {
                return b.toUpperCase()
            });

            if (key in _c) return _c[key];

            var n = document.createElement("div"),
                s = n.style,
                rt = false,
                xb = xui.browser,
                f = function (k) {
                    k = k.replace(/\-(\w)/g, function (a, b) {
                        return b.toUpperCase()
                    });
                    if (s[k] !== undefined)
                        return true;
                    if (xui.browser.cssTag2) {
                        k = xui.browser.cssTag2 + k.charAt(0).toUpperCase() + k.substr(1);
                        if (s[k] !== undefined)
                            return true;
                    }
                    return false;
                };
            n.id = "xui_css3_" + xui.stamp();

            if (key.indexOf("border") === 0) {
                key = key.replace(/[-]?(left|top|right|bottom)/ig, '');
            }
            switch (key) {
                case "opacity":
                case "textShadow": {
                    rt = s[key] === '';
                }
                    break;
                case "generatedContent": {
                    var id = "tmp_css3_test" + xui.id(),
                        css = '#' + n.id + '{line-height:auto;margin:0;padding:0;border:0;font:0/0 a}#' + n.id + ':after{content:\'a\';visibility:hidden;line-height:auto;margin:0;padding:0;border:0;font:3px/1 a}';
                    xui.CSS.addStyleSheet(css, id);
                    xui('body').append(n);
                    var v = n.offsetHeight;
                    xui.CSS.remove("id", id);
                    xui(n.id).remove(n);
                    rt = v >= 3;
                }
                    break;
                case "fontFace": {
                    if (xb.ie && xb.ver >= 6) {
                        rt = true;
                    } else {
                        var id = "tmp_css3_test" + xui.id(),
                            css = '@font-face{font-family:"font";src:url("https://")}',
                            s = xui.CSS.addStyleSheet(css, id),
                            sh = s.sheet || s.styleSheet,
                            ctxt = sh ? ((sh.cssRules && sh.cssRules[0]) ? sh.cssRules[0].cssText : sh.cssText || '') : '';

                        rt = /src/i.test(ctxt) && ctxt.indexOf("@font-face") === 0;
                        xui.CSS.remove("id", id);
                    }
                }
                    break;
                case "rgba": {
                    s.cssText = "background-color:rgba(0,0,0,0.1)";
                    rt = s.backgroundColor.indexOf("rgba") != -1;
                }
                    break;
                case "hsla": {
                    s.cssText = 'background-color:hsla(120,40%,100%,.5)';
                    rt = s.backgroundColor.indexOf('hsla') != -1 || s.backgroundColor.indexOf('rgba') != -1;
                }
                    break;
                case "multiplebgs": {
                    s.cssText = "background:url(//:),url(//:),red url(//:)";
                    rt = /(url\s*\(.*?){3}/.test(s.background);
                }
                    break;
                case "gradient": {
                    var k = 'background-image:',
                        v1 = '-webkit-gradient(linear,left top,right bottom,from(#000),to(#fff));',
                        v2 = 'linear-gradient(left top,#000,#fff);',
                        arr = [k, v2];
                    if (xui.browser.cssTag1) {
                        arr.push(k);
                        arr.push(xui.browser.cssTag1 + v2);
                    }
                    if (xui.browser.isWebKit) {
                        arr.push(k);
                        arr.push(v1);
                    }
                    s.cssText = arr.join('');
                    rt = !!s.backgroundImage;
                }
                    break;
                case "transform3d": {
                    var r = f("perspective");
                    if (r && 'webkitPerspective' in document.documentElement.style) {
                        var id = "tmp_css3_test" + xui.id(),
                            css = '@media (transform-3d),(-webkit-transform-3d){#' + n.id + '{font:0/0;line-height:0;margin:0;padding:0;border:0;left:9px;position:absolute;height:3px;}}';
                        xui.CSS.addStyleSheet(css, id);
                        xui('body').append(n);
                        var v1 = n.offsetLeft, v2 = n.offsetHeight;
                        xui.CSS.remove("id", id);
                        xui(n.id).remove(n);
                        rt = v1 === 9 && v2 === 3;
                    }
                    rt = r;
                }
                    break;
                default: {
                    rt = f(key);
                }
            }
            return _c[key] = rt;
        },
        $AnimateEffects: {
            linear: function (s, c) {
                return (1 / s) * c;
            },
            sineIn: function (s, c) {
                return -1 * Math.cos(c / s * (Math.PI / 2)) + 1;
            },
            sineOut: function (s, c) {
                return Math.sin(c / s * (Math.PI / 2));
            },
            sineInOut: function (s, c) {
                return -1 / 2 * (Math.cos(Math.PI * c / s) - 1);
            },
            quadIn: function (s, c) {
                return (c /= s) * c;
            },
            quadOut: function (s, c) {
                return -1 * (c /= s) * (c - 2);
            },
            quadInOut: function (s, c) {
                if ((c /= s / 2) < 1) {
                    return 1 / 2 * c * c;
                }
                return -1 / 2 * ((--c) * (c - 2) - 1);
            },
            cubicIn: function (s, c) {
                return (c /= s) * c * c;
            },
            cubicOut: function (s, c) {
                return ((c = c / s - 1) * c * c + 1);
            },
            cubicInOut: function (s, c) {
                if ((c /= s / 2) < 1) {
                    return 1 / 2 * c * c * c;
                }
                return 1 / 2 * ((c -= 2) * c * c + 2);
            },
            quartIn: function (s, c) {
                return (c /= s) * c * c * c;
            },
            quartOut: function (s, c) {
                return -1 * ((c = c / s - 1) * c * c * c - 1);
            },
            quartInOut: function (s, c) {
                if ((c /= s / 2) < 1) {
                    return 1 / 2 * c * c * c * c;
                }
                return -1 / 2 * ((c -= 2) * c * c * c - 2);
            },
            quintIn: function (s, c) {
                return (c /= s) * c * c * c * c;
            },
            quintOut: function (s, c) {
                return ((c = c / s - 1) * c * c * c * c + 1);
            },
            quintInOut: function (s, c) {
                if ((c /= s / 2) < 1) {
                    return 1 / 2 * c * c * c * c * c;
                }
                return 1 / 2 * ((c -= 2) * c * c * c * c + 2);
            },
            expoIn: function (s, c) {
                return (c == 0) ? 0 : Math.pow(2, 10 * (c / s - 1));
            },
            expoOut: function (s, c) {
                return (c == s) ? 1 : (-Math.pow(2, -10 * c / s) + 1);
            },
            expoInOut: function (s, c) {
                if (c == 0) {
                    return 0;
                }
                if (c == s) {
                    return 1;
                }
                if ((c /= s / 2) < 1) {
                    return 1 / 2 * Math.pow(2, 10 * (c - 1));
                }
                return 1 / 2 * (-Math.pow(2, -10 * --c) + 2);
            },
            circIn: function (s, c) {
                return -1 * (Math.sqrt(1 - (c /= s) * c) - 1);
            },
            circOut: function (s, c) {
                return Math.sqrt(1 - (c = c / s - 1) * c);
            },
            circInOut: function (s, c) {
                if ((c /= s / 2) < 1) {
                    return -1 / 2 * (Math.sqrt(1 - c * c) - 1);
                }
                return 1 / 2 * (Math.sqrt(1 - (c -= 2) * c) + 1);
            },
            bounceIn: function (s, c) {
                return 1 - xui.Dom.$AnimateEffects.bounceOut(s, s - c);
            },
            bounceOut: function (s, c) {
                var k = 7.5625;
                if ((c /= s) < (1 / 2.75)) {
                    return (k * c * c);
                } else if (c < (2 / 2.75)) {
                    return (k * (c -= (1.5 / 2.75)) * c + .75);
                } else if (c < (2.5 / 2.75)) {
                    return (k * (c -= (2.25 / 2.75)) * c + .9375);
                } else {
                    return (k * (c -= (2.625 / 2.75)) * c + .984375);
                }
            },
            bounceInOut: function (s, c) {
                if (c < s / 2) {
                    return xui.Dom.$AnimateEffects.bounceIn(s, c * 2) * .5;
                } else {
                    return xui.Dom.$AnimateEffects.bounceOut(s, c * 2 - s) * .5 + 1 * .5;
                }
            },
            backIn: function (s, c) {
                var k = 1.70158;
                return (c /= s) * c * ((k + 1) * c - k);
            },
            backOut: function (s, c) {
                var k = 1.70158;
                return ((c = c / s - 1) * c * ((k + 1) * c + k) + 1);
            },
            backInOut: function (s, c) {
                var k = 1.70158;
                if ((c /= s / 2) < 1) {
                    return 1 / 2 * (c * c * (((k *= (1.525)) + 1) * c - k));
                }
                return 1 / 2 * ((c -= 2) * c * (((k *= (1.525)) + 1) * c + k) + 2);
            },
            elasticIn: function (s, c, p, a, z) {
                if (c == 0) {
                    return 0;
                }
                if ((c /= s) == 1) {
                    return 1;
                }
                if (!z) {
                    z = s * .3;
                }
                if (!a || a < 1) {
                    a = 1;
                    var k = z / 4;
                } else {
                    var k = z / (2 * Math.PI) * Math.asin(1 / a);
                }
                return -(a * Math.pow(2, 10 * (c -= 1)) * Math.sin((c * s - k) * (2 * Math.PI) / z));
            },
            elasticOut: function (s, c, p, a, z) {
                if (c == 0) {
                    return 0;
                }
                if ((c /= s) == 1) {
                    return 1;
                }
                if (!z) {
                    z = s * .3;
                }
                if (!a || a < 1) {
                    a = 1;
                    var k = z / 4;
                } else {
                    var k = z / (2 * Math.PI) * Math.asin(1 / a);
                }
                return (a * Math.pow(2, -10 * c) * Math.sin((c * s - k) * (2 * Math.PI) / z) + 1);
            },
            elasticInOut: function (s, c, p, a, z) {
                if (c == 0) {
                    return 0;
                }
                if ((c /= s / 2) == 2) {
                    return 1;
                }
                if (!z) {
                    z = s * (.3 * 1.5);
                }
                if (!a || a < 1) {
                    a = 1;
                    var k = z / 4;
                } else {
                    var k = z / (2 * Math.PI) * Math.asin(1 / a);
                }
                if (c < 1) {
                    return -.5 * (a * Math.pow(2, 10 * (c -= 1)) * Math.sin((c * s - k) * (2 * Math.PI) / z));
                }
                return a * Math.pow(2, -10 * (c -= 1)) * Math.sin((c * s - k) * (2 * Math.PI) / z) * .5 + 1;
            }
        },
        $preDefinedAnims: {
            blinkAlert: {
                endpoints: {opacity: [1, 0]},
                duration: 200,
                restore: true,
                times: 3
            },
            blinkAlertLoop: {
                endpoints: {opacity: [1, 0]},
                duration: 500,
                restore: true,
                times: -1
            },
            rotateAlert: {
                endpoints: {rotate: [0, 360]},
                duration: 400,
                restore: false
            },
            rotateAlertLoop1: {
                endpoints: {rotate: [0, 360]},
                duration: 2000,
                restore: false,
                times: -1
            },
            rotateAlertLoop2: {
                endpoints: {rotate: [0, -360]},
                duration: 2000,
                returned: false,
                times: -1
            },
            zoomAlert: {
                endpoints: {scaleX: [1, 1.1], scaleY: [1, 1.1]},
                duration: 100,
                restore: true,
                times: 3
            },
            translateXAlert: {
                endpoints: {translateX: [0, 5]},
                duration: 100,
                restore: true,
                times: 3
            },
            translateYAlert: {
                endpoints: {translateY: [0, 5]},
                duration: 100,
                restore: true,
                times: 3
            }
        },
        $preDefinedEffects: {
            "Classic": [{
                type: "circOut",
                duration: 200,
                endpoints: {opacity: [0, 1], scaleX: [.75, 1], scaleY: [.75, 1]}
            }, {type: "circIn", duration: 200, endpoints: {opacity: [1, 0], scaleX: [1, .75], scaleY: [1, .75]}}],
            "Blur": [{type: "circOut", duration: 200, endpoints: {opacity: [0, 1]}}, {
                type: "circIn",
                duration: 200,
                endpoints: {opacity: [1, 0]}
            }],
            "Drop": [{
                type: "circOut",
                duration: 200,
                endpoints: {opacity: [0, 1], translateY: ["-25%", "0%"], scaleY: [.5, 1]}
            }, {
                type: "circIn",
                duration: 200,
                endpoints: {opacity: [1, 0], translateY: ["0%", "-25%"], scaleY: [1, .5]}
            }],
            "From Below": [{
                type: "circOut",
                duration: 200,
                endpoints: {opacity: [0, 1], scaleX: [0, 1], scaleY: [0, 1]}
            }, {type: "circIn", duration: 200, endpoints: {opacity: [1, 0], scaleX: [1, 0], scaleY: [1, 0]}}],
            "From Above": [{
                type: "circOut",
                duration: 200,
                endpoints: {opacity: [0, 1], scaleX: [2, 1], scaleY: [2, 1]}
            }, {type: "circIn", duration: 200, endpoints: {opacity: [1, 0], scaleX: [1, 2], scaleY: [1, 2]}}],
            "Slide In LR": [{
                type: "circOut",
                duration: 200,
                endpoints: {opacity: [0, 1], translateX: ["-150%", "0%"]/*,scaleX:[.2,1],scaleY:[.2,1]*/}
            }, {
                type: "circIn",
                duration: 200,
                endpoints: {opacity: [1, 0], translateX: ["0%", "150%"]/*,scaleX:[1,.2],scaleY:[1,.2]*/}
            }],
            "Slide In TB": [{
                type: "circOut",
                duration: 200,
                endpoints: {opacity: [0, 1], translateY: ["-150%", "0%"]/*,/*scaleX:[.2,1],scaleY:[.2,1]*/}
            }, {
                type: "circIn",
                duration: 200,
                endpoints: {opacity: [1, 0], translateY: ["0%", "150%"]/*,scaleX:[1,.2],scaleY:[1,.2]*/}
            }],
            "Flip V": [{type: "circOut", duration: 200, endpoints: {opacity: [0, 1], scaleY: [0, 1]}}, {
                type: "circIn",
                duration: 200,
                endpoints: {opacity: [1, 0], scaleY: [1, 0]}
            }],
            "Flip H": [{type: "circOut", duration: 200, endpoints: {opacity: [0, 1], scaleX: [0, 1]}}, {
                type: "circIn",
                duration: 200,
                endpoints: {opacity: [1, 0], scaleX: [1, 0]}
            }]
        },
        _getEffects: function (key, isIn) {
            if (key && typeof(key) == "string") {
                key = this.$preDefinedEffects[key];
                key = key ? isIn ? key[0] : key[1] : null;
            }
            if (key && xui.browser.ie && xui.browser.ver <= 8) {
                xui.filter(key, function (o, i) {
                    return !!xui.Dom._cssfake[i];
                });
            }
            return key;
        },
        _setUnitStyle: function (node, key, value) {
            if (!node || node.nodeType != 1) return false;
            var style = node.style;
            if (value || value === 0) {
                value = xui.CSS.$addu(value);
                if (value && (key == 'width' || key == 'height') && value.charAt(0) == '-') value = '0';
                if (style[key] != value) {
                    style[key] = value;
                    return true;
                }
            }
            return false;
        },
        _emptyDivId: "xui.empty:",
        getEmptyDiv: function (pid, sequence) {
            var i = 1, id, rt, style, o, t, count = 0, doc = document,
                body = pid && (pid = xui(pid)).get(0) || doc.body,
                ini = function (o) {
                    o.id = id;
                    // position:relative; is for text wrap bug
                    xui([o]).attr('style', 'position:absolute;visibility:hidden;overflow:visible;left:' + xui.Dom.HIDE_VALUE + ';top:' + xui.Dom.HIDE_VALUE + ';');
                };
            sequence = sequence || 1;
            pid = body == doc.body ? '' : pid.n0.replace('!', '');
            while (1) {
                id = this._emptyDivId + pid + ":" + i;
                //don't remove this {
                if (o = xui.Dom.byId(id)) {
                    //Using firstChild, for performance
                    if ((!o.firstChild || (o.firstChild.nodeType == 3 && !o.firstChild.nodeValue)) && ++count == sequence)
                        return xui([o]);
                } else {
                    o = doc.createElement('div');
                    ini(o, id);
                    if (body.firstChild)
                        body.insertBefore(o, body.firstChild);
                    else
                        body.appendChild(o);
                    rt = xui([o]);
                    body = o = null;
                    return rt;
                }
                i++;
            }
            body = o = null;
        },
        setCover: function (visible, label, busyIcon, cursor, bgStyle) {
            // get or create first
            var me = arguments.callee,
                id = "xui.temp:cover:",
                id2 = "xui.temp:message:",
                content = (typeof(visible) == 'string' || typeof(visible) == 'function') ? visible : '',
                o1, o2;

            if ((o1 = xui(id)).isEmpty()) {
                xui('body').prepend(o1 = xui.create('<button id="' + id + '" class="xui-node xui-node-div xui-cover xui-cover-global xui-custom" style="position:absolute;display:none;text-align:center;left:0;top:0;border:0;padding:0;margin:0;padding-top:2em;"><div id="' + id2 + '" class="xui-node xui-node-div xui-coverlabel xui-custom"></div></button>'));
                o1.setSelectable(false);
                xui.setNodeData(o1.get(0), 'zIndexIgnore', 1);
            }
            if (xui.Dom.byId(id2)) {
                o2 = xui(id2);
            }

            //clear the last one
            if (!visible) {
                if (typeof me._label == 'string' && me._label !== label)
                    return;
                if (me._showed) {
                    if (o2) o2.empty(false);
                    o1.css({zIndex: 0, cursor: '', display: 'none', cursor: ''});
                    o1.query('style').remove(false);
                    me._showed = false;
                }
                delete me._label;
            } else {
                if (typeof label == 'string') me._label = label;
                var t = xui.win;
                if (!me._showed) {
                    o1.css({
                        zIndex: xui.Dom.TOP_ZINDEX * 10,
                        display: '',
                        width: t.scrollWidth() + 'px',
                        height: t.scrollHeight() + 'px',
                        cursor: cursor || 'progress'
                    });
                    if (busyIcon) o1.addClass('xuicon xui-icon-loading'); else o1.removeClass('xuicon xui-icon-loading');
                    me._showed = true;
                }

                o1.query('style').remove(false);
                if (bgStyle)
                    xui.CSS._appendSS(o1.get(0), ".xui-cover-global:before{" + bgStyle + "}", "", true);

                //show content
                if (content) {
                    if (typeof(content) == 'function') {
                        content(o1, o2);
                    } else if (o2) {
                        o2.html(content + '', false);
                    }
                }
            }
        },

        byId: function (id) {
            return document.getElementById(id || "");
        },
        $hasEventHandler: function (node, name) {
            return xui.getNodeData(node, ['eHandlers', name]);
        },
        /*
        action: uri
        data:hash{key:value}
        method:'post'(default) or 'get'
        target: uri target: _blank etc.
        */
        submit: function (action, data, method, target, enctype) {
            data = xui.isHash(data) ? data : {};
            data = xui.clone(data, function (o) {
                return o !== undefined
            });

            action = action || '';
            target = target || (action.substring(0, 6).toLowerCase() == 'mailto' ? '_self' : '_blank');
            var _t = [];
            if (!xui.isEmpty(data)) {
                var file, files = [];
                xui.each(data, function (o, i) {
                    if (o && o['xui.UIProfile'] && o.$xuiFileCtrl) {
                        if (file = o.boxing().getUploadObj()) {
                            files.push({id: o.$xid, file: file});
                            file.id = file.name = i;
                            data[i] = file;
                        }
                    }
                });

                method = method || (file ? 'post' : 'get');

                if (method.toLowerCase() == 'get') {
                    window.open(action + "?" + xui.urlEncode(data), target);
                } else {
                    xui.each(data, function (o, i) {
                        if (xui.isDefined(o) && !xui.isElem(o))
                            _t.push('<textarea name="' + i + '">' + (typeof o == 'object' ? xui.serialize(o) : o) + '</textarea>');
                    });
                    _t.push('<input type="hidden" name="rnd" value="' + xui.rand() + '">');
                    _t = xui.str.toDom('<form target="' + target + '" action="' + action + '" method="' + method + (enctype ? '" enctype="' + enctype : '') + '">' + _t.join('') + '</form>');
                    xui.Dom.getEmptyDiv().append(_t);
                    // 1. add files
                    if (files.length) {
                        xui.arr.each(files, function (o, i) {
                            _t.append(o.file);
                        });
                    }
                    // 2.submit
                    _t.get(0).submit();
                    _t.remove();
                    _t = null;
                }
                // 3.restore file input
                if (files.length) {
                    xui.arr.each(files, function (o, i) {
                        if (i = xui.getObject(o.id)) {
                            if (i['xui.UIProfile'] && i.boxing() && i.boxing().setUploadObj) {
                                i.boxing().setUploadObj(o.file);
                            }
                        }
                    });
                }
            } else {
                window.open(action, target);
            }
        },
        selectFile: function (callback, accept, multiple) {
            var fileInput = document.createElement("input");
            fileInput.type = "file";
            // "image/*, video/*, audio/*"
            if (accept) fileInput.accept = accept;
            if (multiple) fileInput.multiple = "multiple";

            fileInput.onchange = function () {
                xui.tryF(callback, [this, this.files[0], this.files], this);
            };
            if (!!window.ActiveXObject || "ActiveXObject" in window) {
                var label = document.createElement("div");
                fileInput.appendChild(label);
                label.click();
                fileInput.removeChild(label);
            } else {
                fileInput.click();
            }
            fileInput = null;
        },
        busy: function (id, busyMsg, busyIcon, cursor, bgStyle) {
            xui.Dom.setCover(busyMsg || true, id, busyIcon, cursor, bgStyle);
        },
        free: function (id) {
            xui.Dom.setCover(false, id);
        },
        animate: function (css, endpoints, onStart, onEnd, duration, step, type, threadid, unit, restore, times) {
            var node = document.createElement('div');
            xui.merge(css, {position: 'absolute', left: this.HIDE_VALUE, zIndex: this.TOP_ZINDEX++});
            xui.Dom.setStyle(node, css);
            document.body.appendChild(node);
            return xui([node]).animate(endpoints, onStart, function () {
                xui.tryF(onEnd);
                if (node.parentNode)
                    node.parentNode.removeChild(node);
                node = null;
            }, duration, step, type, threadid, unit, restore, times);
        },
        //plugin event function to xui.Dom
        $enableEvents: function (name) {
            if (!xui.isArr(name)) name = [name];
            var self = this, f;
            xui.arr.each(name, function (o) {
                f = function (fun, label, flag) {
                    if (typeof fun == 'function')
                        return this.$addEvent(o, fun, label, flag);
                    else if (fun === null)
                        return this.$removeEvent(o, label, flag);
                    var args = arguments[1] || {};
                    args.$xuiall = (arguments[0] === true);
                    return this.$fireEvent(o, args)
                };
                f.$event$ = 1;
                self.plugIn(o, f)
            });
        }
    },
    After: function (d) {
        var self = this;
        //getter
        xui.each({
            parent: ['y', false],
            prev: ['x', false],
            next: ['x', true],
            first: ['y', true],
            last: ['y', 1]
        }, function (o, i) {
            self.plugIn(i, function (index) {
                return this.$iterator(o[0], o[1], true, index || 1)
            });
        });

        //readonly profile
        xui.arr.each(xui.toArr('offsetLeft,offsetTop,scrollWidth,scrollHeight'), function (o) {
            self.plugIn(o, function () {
                var t = this.get(0), w = window, d = document;
                if (t == w || t == d) {
                    if ("scrollWidth" == o || "scrollHeight" == o) {
                        var a = d.documentElement, b = d.body;
                        return Math.max(a[o], b[o]);
                    } else
                        t = xui.browser.contentBox ? d.documentElement : d.body;
                }
                return t[o];
            })
        });

        var p = 'padding', m = 'margin', b = 'border', c = 'inner', o = 'offset', r = 'outer', w = 'width',
            h = 'height', W = 'Width', H = 'Height', T = 'Top', L = 'Left', t = 'top', l = 'left', R = 'Right',
            B = 'Bottom';
        //dimesion
        xui.arr.each([['_' + p + 'H', p + T, p + B],
            ['_' + p + 'W', p + L, p + R],
            ['_' + b + 'H', b + T + W, b + B + W],
            ['_' + b + 'W', b + L + W, b + R + W],
            ['_' + m + 'W', m + L, m + R],
            ['_' + m + 'H', m + T, m + B]
        ], function (o) {
            //use get Style dir
            var node, fun = xui.Dom.getStyle;
            self.plugIn(o[0], function (type) {
                type = type || 'both';
                node = this.get(0);
                return ((type == 'both' || type == 'left' || type == 'top') ? xui.CSS.$px(fun(node, o[1]), node) : 0)
                    + ((type == 'both' || type == 'right' || type == 'bottom') ? xui.CSS.$px(fun(node, o[2]), node) : 0) || 0;
            })
        });
        /*
        get W/H for

        1:width
        2:innerWidth
        3:offsetWidth
        4:outerWidth

        content-box
        +--------------------------+
        |margin                    |
        | +----------------------+ |
        | |border                | |
        | | +------------------+ | |
        | | |padding           | | |
        | | | +--------------+ | | |
        | | | |   content    | | | |
        |-|-|-|--------------|-|-|-|
        | | | |<-css width ->| | | |
        | | |<-  innerWidth  ->| | |
        | |<--  offsetWidth   -->| |
        |<--    outerWidth      -->|

        border-box
        +--------------------------+
        |margin                    |
        | +----------------------+ |
        | |border                | |
        | | +------------------+ | |
        | | |padding           | | |
        | | | +--------------+ | | |
        | | | |   content    | | | |
        |-|-|-|--------------|-|-|-|
        | | |<-   css width  ->| | |
        | | |<-  innerWidth  ->| | |
        | |<--  offsetWidth   -->| |
        |<--    outerWidth      -->|
        */

        xui.arr.each([['_W', w, '_' + p + 'W', '_' + b + 'W', '_' + m + 'W', c + W, o + W],
            ['_H', h, '_' + p + 'H', '_' + b + 'H', '_' + m + 'H', c + H, o + H]], function (o) {
            var _size = function (node, index, value, _in) {
                var n, r, t, style = node.style, contentBox = xui.browser.contentBox,
                    r1 = /%$/,
                    getStyle = xui.Dom.getStyle,
                    f = xui.Dom._setUnitStyle, type = typeof value, t1;
                if (type == 'undefined' || type == 'boolean') {
                    if (value === true) {
                        n = (getStyle(node, 'display') == 'none') || node.offsetHeight === 0;
                        if (n) {
                            var temp = xui.Dom.getEmptyDiv().html('*', false);
                            xui([node]).swap(temp);
                            var b, p, d;
                            b = style.visibility, p = style.position, d = style.display;
                            p = p || '';
                            b = b || '';
                            d = d || '';
                            style.visibility = 'hidden';
                            style.position = 'absolute';
                            style.display = 'block';
                        }
                    }
                    t = xui([node]);
                    switch (index) {
                        case 1:
                            r = getStyle(node, o[1]);
                            if ((isNaN(parseFloat(r)) || r1.test(r)) && !_in)
                                r = _size(node, 2, undefined, true) - (contentBox ? t[o[2]]() : 0);
                            r = xui.CSS.$px(r, node) || 0;
                            break;
                        case 2:
                            if (node === document || node === window) {
                                r = xui(node)[o[1]]();
                            } else {
                                r = node[o[6]];
                                //get from css setting before css applied
                                if (!r) {
                                    if (!_in) r = _size(node, 1, undefined, true) + (contentBox ? t[o[2]]() : 0);
                                } else r -= t[o[3]]();
                            }
                            break;
                        case 3:
                            if (node === document || node === window) {
                                r = xui(node)[o[1]]();
                            } else {
                                r = node[o[6]];
                                //get from css setting before css applied
                                if (!r) r = _size(node, 1, value, true) + (contentBox ? t[o[2]]() : 0) + t[o[3]]();
                            }
                            break;
                        case 4:
                            r = _size(node, 3, value);
                            r += t[o[4]]();
                            break;
                    }
                    if (n) {
                        style.display = d;
                        style.position = p;
                        style.visibility = b;
                        t.swap(temp);
                        temp.empty(false);
                    }
                    return parseFloat(r) || 0;
                } else {
                    switch (index) {
                        case 1:
                            if (f(node, o[1], value))
                                if (xui.Dom.$hasEventHandler(node, 'onsize')) {
                                    var args = {};
                                    args[o[1]] = 1;
                                    xui([node]).onSize(true, args);
                                }
                            break;
                        case 2:
                            _size(node, 1, value - (contentBox ? xui([node])[o[2]]() : 0));
                            break;
                        case 3:
                            //back value for offsetHeight/offsetWidth slowly
                            _size(node, 1, value - (t = xui([node]))[o[3]]() - (contentBox ? t[o[2]]() : 0));
                            break;
                        case 4:
                            _size(node, 1, value - (t = xui([node]))[o[4]]() - t[o[3]]() - (contentBox ? t[o[2]]() : 0));
                            break;
                    }
                    //if(node._bp)
                    //    node['_'+o[6]]=null;
                }
            };
            self.plugIn(o[0], _size)
        });
        xui.arr.each([[c + W, '_W', 2], [o + W, '_W', 3], [r + W, '_W', 4],
            [c + H, '_H', 2], [o + H, '_H', 3], [r + H, '_H', 4]], function (o) {
            self.plugIn(o[0], function (value) {
                var type = typeof value;
                if (type == 'undefined' || type == 'boolean')
                    return this[o[1]](this.get(0), o[2], value);
                else
                    return this.each(function (v) {
                        this[o[1]](v, o[2], value);
                    });
            })
        });
        xui.arr.each([[l + 'By', l], [t + 'By', t], [w + 'By', w], [h + 'By', h]], function (o) {
            self.plugIn(o[0], function (offset, triggerEvent) {
                if (offset === 0) return this;
                var m, args, k = o[1];
                return this.each(function (node) {
                    m = xui.use(node.$xid)[k]();
                    m = (parseFloat(m) || 0) + offset;
                    if (k == 'width' || k == 'height') m = m > 0 ? m : 0;
                    node.style[k] = xui.CSS.$forceu(m, null, node);
                    if (triggerEvent) {
                        args = {};
                        args[k] = 1;
                        var f = xui.Dom.$hasEventHandler;
                        if ((k == 'left' || k == 'top') && f(node, 'onmove'))
                            xui([node]).onMove(true, args);
                        if ((k == 'width' || k == 'height') && f(node, 'onsize')) {
                            xui([node]).onSize(true, args);
                        }
                    }
                }, this)
            });
        });
        xui.arr.each(['scrollLeft', 'scrollTop'], function (o) {
            self.plugIn(o, function (value) {
                var a = document.documentElement, b = document.body, v;
                if (value !== undefined)
                    return this.each(function (v) {
                        if (v === window || v === document) {
                            if (a) a[o] = value;
                            if (b) b[o] = value;
                        } else if (v) v[o] = value;
                    });
                else
                    return (v = this.get(0)) ? (v === window || v === document) ? (window["scrollTop" == o ? "pageYOffset" : "pageXOffset"] || (a[o] || b[o] || 0))
                        : v[o]
                        : 0;
            })
        });
        xui.arr.each('width,height,left,top'.split(','), function (o) {
            self.plugIn(o, function (value) {
                var self = this, node = self.get(0), b = xui.browser, type = typeof value, doc = document, t, style;
                if (!node || node.nodeType == 3) return;
                if (type == 'undefined' || type == 'boolean') {
                    if ((o == 'width' && (t = 'Width')) || (o == 'height' && (t = 'Height'))) {
                        if (doc === node) return Math.max(doc.body['scroll' + t], doc.body['offset' + t], doc.documentElement['scroll' + t], doc.documentElement['offset' + t]);
                        if (window === node) return b.opr ? Math.max(doc.body['client' + t], window['inner' + t]) : b.kde ? window['inner' + t] : (xui.browser.contentBox && doc.documentElement['client' + t]) || doc.body['client' + t];
                    }
                    style = node.style;
                    // give shortcut
                    // we force to get px number of width/height
                    if (o == 'width') value = (xui.CSS.$isPx(style.width) && parseFloat(style.width)) || self._W(node, 1, value);
                    else if (o == 'height') value = (xui.CSS.$isPx(style.height) && parseFloat(style.height)) || self._H(node, 1, value);
                    else
                        value = xui.Dom.getStyle(node, o, true);
                    return (value == 'auto' || value === '') ? value : (value || 0);
                } else {
                    var f = xui.Dom._setUnitStyle, t, a,
                        av = xui.CSS.$addu(value);
                    return self.each(function (v) {
                        if (v.nodeType != 1) return;
                        if (v.style[o] !== av) {
                            if (o == 'width') self._W(v, 1, value);
                            else if (o == 'height') self._H(v, 1, value);
                            else {
                                if (f(v, o, value))
                                    if ((o == 'top' || o == 'left') && xui.Dom.$hasEventHandler(node, 'onmove')) {
                                        a = {};
                                        a[o] = 1;
                                        xui([v]).onMove(true, a);
                                    }
                            }
                        }
                    });
                }
            });
        });

        //xui.Dom event
        xui.arr.each(xui.Event._events, function (o) {
            xui.arr.each(xui.Event._getEventName(o), function (o) {
                self.$enableEvents(o);
            })
        });
    },
    Initialize: function () {
        var w = window, d = document;
        xui.browser.contentBox = xui(d.documentElement).contentBox();
        xui.set(xui.$cache.domPurgeData, '!window', {$xid: '!window', element: w});
        xui.set(xui.$cache.domPurgeData, '!document', {$xid: '!document', element: d});

        xui.win = xui(['!window'], false);
        xui.doc = xui(['!document'], false);
        xui.frame = xui.win;

        xui.busy = xui.Dom.busy;
        xui.free = xui.Dom.free;

        xui.$inlineBlock = xui.browser.gek
            ? xui.browser.ver < 3
                ? ['-moz-inline-block', '-moz-inline-box', 'inline-block']
                : ['inline-block']
            : (xui.browser.ie && xui.browser.ver <= 6)
                ? ['inline-block', 'inline']
                : ['inline-block'];
        var fun = function (p, e, cache, keydown) {
            var event = xui.Event, set, hash, rtnf, rst, remove = {},
                ks = event.getKey(e);
            if (ks) {
                if (ks[0].length == 1) ks[0] = ks[0].toLowerCase();
                //if hot function return false, stop bubble
                if (arr = cache[ks.join(":")]) {
                    xui.arr.each(arr, function (key, i) {
                        set = arr[key];
                        if (set) {
                            // remove hook for non-exist dom
                            if (set[3] && (typeof set[3] == 'function' ? false === (set[3])() : (!xui(set[3]).size()))) {
                                // do nothing and detach it
                                delete arr[key];
                                remove[i] = 1;
                                return;
                            }
                            rst = xui.tryF(set[0], set[1] || [arr, i, key], set[2]);
                            if (rst === false) {
                                rtnf = 1;
                                return false;
                            } else if (rst === true) {
                                // detach it
                                delete arr[key];
                                remove[i] = 1;
                            }
                        }
                    }, null, true);
                    // remove
                    xui.filter(arr, function (key, i) {
                        return !remove[i];
                    });
                    if (rtnf) {
                        event.stopBubble(e);
                        return false;
                    }
                }
                if (xui.Module) {
                    xui.arr.each(xui.Module._cache, function (m) {
                        // by created order
                        if (m._evsClsBuildIn && ('onHookKey' in m._evsClsBuildIn)) {
                            // function or pseudocode
                            if (xui.isFun(f = m._evsClsBuildIn.onHookKey) || (xui.isArr(f) && f[0].type))
                                m.fireEvent('onHookKey', [m, ks, keydown, e]);
                        }
                        else if (m._evsPClsBuildIn && ('onHookKey' in m._evsPClsBuildIn)) {
                            // function or pseudocode
                            if (xui.isFun(f = m._evsPClsBuildIn.onHookKey) || (xui.isArr(f) && f[0].type))
                                m.fireEvent('onHookKey', [m, ks, keydown, e]);
                        }
                    });
                }
            }
            return true;
        };
        //hot keys
        xui.doc.onKeydown(function (p, e) {
            xui.Event.$keyboard = xui.Event.getKey(e);
            fun(p, e, xui.$cache.hookKey, true)
        }, "document")
            .onKeyup(function (p, e) {
                delete xui.Event.$keyboard;
                fun(p, e, xui.$cache.hookKeyUp, false)
            }, "document");

        //hook link(<a ...>xxx</a>) click action
        //if(xui.browser.ie || xui.browser.kde)
        xui.doc.onClick(function (p, e, src) {
            var o = xui.Event.getSrc(e),
                i = 0, b, href;
            do {
                if (o.nodeName == 'A') {
                    b = true;
                    break;
                }
                if (++i > 8) break;
            } while (o = o.parentNode)
            if (b) {
                href = xui.str.trim(o.href || "").toLowerCase();
                if (xui.History) {
                    var s = location.href.split('#')[0];
                    if (!xui.Event.getKey(e).shiftKey && xui.Event.getBtn(e) == 'left' && (href.indexOf(s + '#') == 0 || href.indexOf('#') == 0)) {
                        xui.History.setFI(o.href.replace(s, ''));
                    }
                }
                //**** In IE, click a fake(javascript: or #) href(onclick not return false) will break the current script downloading(SAajx)
                //**** You have to return false here
                if (xui.browser.ie && (href.indexOf('javascript:') == 0 || href.indexOf('#') !== -1)) return false;
            }
        }, 'hookA', 0);

        var _ieselectstart = function (n, v) {
            n = window.event.srcElement;
            while (n && n.nodeName && n.nodeName != "BODY" && n.nodeName != "HTML") {
                if (v = xui.getNodeData(n, "_onxuisel"))
                    return v != 'false';
                // check self only
                if (n.nodeName == "INPUT" || n.nodeName == "TEXTAREA")
                    break;
                n = n.parentNode;
            }
            return true;
        };
        if (xui.browser.ie && xui.browser.ver < 10 && d.body)
            xui.Event._addEventListener(d.body, "selectstart", _ieselectstart);

        //free memory
        xui.win.afterUnload(xui._destroy = function () {
            var t,
                lowie = xui.browser.ie && xui.browser.ver <= 8,
                e = xui.Event,
                _cw = function (w, k) {
                    w[k] = undefined;
                    if (!lowie)
                        delete w[k];
                };

            if (xui.History._checker) e._removeEventListener(w, "hashchange", xui.History._checker);
            e._removeEventListener(d.body, "selectstart", _ieselectstart);
            e._removeEventListener(w, "resize", e.$eventhandler);

            e._removeEventListener(w, "mousewheel", e.$eventhandler3);
            e._removeEventListener(d, "mousewheel", e.$eventhandler3);
            // firfox only
            e._removeEventListener(w, "DOMMouseScroll", e.$eventhandler3);
            // for simulation mouse event in touable device
            if (xui.browser.isTouch) {
                e._removeEventListener(d,
                    (xui.browser.ie && w.PointerEvent) ? "pointerdown" :
                        (xui.browser.ie && w.MSPointerEvent) ? "MSPointerDown" :
                            "touchstart", e._simulateMousedown);
                e._removeEventListener(d,
                    (xui.browser.ie && xui.browser.ver >= 11) ? "pointerup" :
                        (xui.browser.ie && xui.browser.ver >= 10) ? "MSPointerUp" :
                            "touchend", e._simulateMouseup);
            }

            // xui.win.afterUnload ...
            for (var i in (t = xui.$cache.domPurgeData))
                if (t[i].eHandlers)
                    xui(i).$clearEvent();

            // destroy all widgets and moudles
            // xui('body').empty(true,true);
            for (var i in (t = xui._pool)) {
                t[i] && t[i].destroy && t[i].destroy(1, 1);
                t[i] && t[i].Instace && t[i].Instace.destroy && t[i].Instace.destroy(1, 1);
            }

            // root module ref
            _cw(w, xui.ini.rootModuleName);
            if (w.Raphael && w.Raphael._in_xui) {
                _cw(w, 'Raphael');
            }

            xui.SC.__gc();
            xui.Thread.__gc();
            xui.Class.__gc();
            if (/xui\.Class\.apply/.test(w.Class)) _cw(w, 'Class');
            if ((t = xui.Namespace._all)) for (var i in t) _cw(w, t[i]);
            xui.breakO(xui.$cache, 2);
            xui.breakO([xui.Class, xui], 3);
            _cw(w, 'xui_ini');
            _cw(w, 'xui');

            w = d = null;
        }, "window", -1);

    }
});xui.Class('xui.Template','xui.absProfile',{
    Constructor:function(template,properties,events,domId){
        var upper=arguments.callee.upper, args=xui.toArr(arguments);
        upper.apply(this,args);
        upper=null;
        
        var self=this;
        self.$domId = self.KEY + ':' + (self.serialId=self._pickSerialId()) + ':';
        self.domId = typeof domId == 'string'?domId:self.$domId;
        self._links={};
        self.template={'root':[['<div></div>'],[]]};
        self.properties={};
        self.events={};
        self.$template={};
        self.link(self.constructor._cache,'self').link(xui._pool,'xui');
        self.Class=self.constructor;
        self.box=self.constructor;
        self.boxing=function(){return this};

        if(template)self.setTemplate(typeof template=='string'?{'root':template}:template);
        if(events)self.setEvents(events);
        if(properties)self.setProperties(properties);
        return self;
    },
    Instance : {
        renderId:null,
        __gc:function(){
            var self=this,
                t=xui.$cache.reclaimId;
            if(!self.$noReclaim) 
                (t[self.KEY] || (t[self.KEY]=[])).push(self.serialId);
            else 
                delete self.$noReclaim

            delete xui.$cache.profileMap[self.domId];
            delete xui.$cache.profileMap[self.$domId];
            self.unLinkAll();
            xui.breakO([self.properties, self.event, self], 2);
        },
        _reg0:/^\w[\w_-]*$/,
        show:function(parent){
            if(!parent)parent=xui('body');
            parent=xui(parent);
            parent.append(this);
            return this;
        },
        getRootNode:function(){
            return xui.getNodeData(this.renderId, 'element');
        },
        /*
         *getRoot is the only function that depends on xui.Dom Class
        */
        getRoot:function(){
            return xui([this.renderId],false);
        },
        setDomId:function(id){
            var t=this, c=xui.$cache.profileMap, reg=t._reg0;
            //ensure the value
            if(typeof id== 'string' && reg.test(id) && !document.getElementById(id)){
                //delete the original one
                if(t.domId!=t.$domId)delete c[t.domId];
                //set profile's domId
                t.domId=id;
                //change the domNode id value
                if(t.renderId)
                    t.getRootNode().id=id;
                //if doesn't create yet, don't set it to xui.$cache:
                if(c[t.$domId])c[id]=t;
            }
            return t;
        },
        destroy:function(){
            if(this.renderId){
                var rn=this.getRootNode();
                xui.$purgeChildren(rn);
                if(rn.parentNode)
                    rn.parentNode.removeChild(rn);
                rn=null;
            }else this.__gc();          
        },
        setEvents:function(key,value){
            var self=this;
            if(typeof key == 'object')
                self.events=key;
            else
                self.events[key]=value;
            return self;
        },
        setTemplate:function(key,value){
            var self=this, t=self.template,$t=self.$template,h;
            if(typeof key == 'object'){
                self.template=key;
                h={};
                for(var i in key)
                    h[i||'root']=self._buildTemplate(key[i]);
                self.$template=h;
            }else if(typeof value == 'string')
                $t[key]=self._buildTemplate(t[key]=value);
            else
                $t['root']=self._buildTemplate(t['root']=key);
            return self;
        },
        setProperties:function(key,value){
            var self=this;
            if(typeof key == 'object')
                self.properties=key;
            else
                self.properties[key]=value;
            return self;
        },
        getItem:function(src){
            var obj=xui.getNodeData(src);
            if(!obj)return;

            var id=obj.tpl_evid, tpl_evkey=obj.tpl_evkey;
            if(!id || !tpl_evkey)return;

            var me=arguments.callee,
                f = me.f || (me.f = function(data, tpl_evkey, id){
                    var i,o,j,v;
                    for(j in data){
                        o=data[j];
                        if(xui.isArr(o) && (tpl_evkey==j||tpl_evkey.indexOf((data.tpl_evkey||j)+'.')===0))
                            for(i=0;v=o[i];i++){
                                if(v.tpl_evkey==tpl_evkey&&v.id==id)return v;
                                else if(v=f(v,tpl_evkey,id)) return v;
                            }
                    }
                });
            return f(this.properties, tpl_evkey, id);
        } ,
        _pickSerialId:function(){
            //get id from cache or id
            var arr = xui.$cache.reclaimId[this.KEY];
            if(arr && arr[0])return arr.shift();
            return this.constructor._ctrlId.next();
        },
        render:function(){
            var self=this;
            if(!self.renderId){
                var div=xui.$getGhostDiv();
                xui.$cache.profileMap[self.domId]=xui.$cache.profileMap[self.$domId]=this;
                div.innerHTML = self.toHtml();
                //add event handler
                var ch=self.events,
                    eh=xui.Event._eventHandler,
                    children=div.getElementsByTagName('*'),
                    domId=self.$domId,
                    f=xui.Event.$eventhandler,
                    i,l,j,k,o,key,id,t,v;
                if(l=children.length){
                    for(i=0;i<l;i++){
                        if((o=children[i]).nodeType!=1)continue;
                        key=o.getAttribute('tpl_evkey');
                        id=o.getAttribute('tpl_evid');
                        if(key!==null && id!==null){
                            v=xui.$registerNode(o);
                            v.tpl_evkey=key;
                            v.tpl_evid=id;
                            if(t = ch[key] ){
                                v=v.eHandlers||(v.eHandlers={});
                                for(j in t){
                                    //attach event handler to domPurgeData
                                    v[j]=f;
                                    //attach event handler to dom node
                                    if(k=eh[j]){
                                        v[k]=f;
                                        xui.Event._addEventListener(o, k, f);
                                    }
                                }
                            }
                            o.removeAttribute('tpl_evkey');
                            o.removeAttribute('tpl_evid');
                        }
                    }
                    if(!div.firstChild.$xid)
                        xui.$registerNode(div.firstChild);
                    //the first
                    self.renderId=div.firstChild.$xid;
                }
                o=div=null;
            }
            return self;
        },
        refresh:function(){
            var ns=this;
            if(ns.renderId){
                var proxy = document.createElement('span'), 
                    rn = ns.getRootNode(),
                    cache=xui.$cache.profileMap;
                
                //avoid of being destroyed                
                delete cache[ns.domId];
                delete cache[ns.$domId];
                
                if(rn.parentNode)
                    rn.parentNode.replaceChild(proxy,rn);
                ns.destroy();
                
                delete ns.renderId;

                ns.render();

                if(proxy.parentNode)
                    proxy.parentNode.replaceChild(ns.getRootNode(), proxy);

                proxy=rn=null;
            }
            return ns;
        },
        renderOnto:function(node){
            var self=this,id,domNode,style='style',t;
            if(typeof node=='string')node=document.getElementById(node);
            id=node.id||self.domId;
            
            //ensure renderId
            if(!self.renderId)
                self.render();
            
            domNode=self.getRootNode();
            node.parentNode.replaceChild(domNode,node);

            if(domNode.tabIndex!=node.tabIndex)
                domNode.tabIndex!=node.tabIndex;
            if(node.className)
                domNode.className += node.className;
            if(xui.browser.ie && (t=node.style.cssText))
                domNode.style.cssText += t+'';
            else if(t=node.getAttribute(style))
                domNode.setAttribute(style, (domNode.getAttribute(style)||'') + t);

            this.setDomId(id);
        },
        toHtml:function(properties){
            //must copy it for giving a default tpl_evkey
            var p=xui.copy(properties||this.properties||{});
            p.tpl_evkey="root";
            return this._doTemplate(p);
        },
        _reg1:/([^{}]*)\{([\w]+)\}([^{}]*)/g,
        _reg2:/\[event\]/g,
        _buildTemplate:function(str){
            if(typeof str=='string'){
                var obj=[[],[]],
                    a0=obj[0],
                    a1=obj[1];
                str=str.replace(this._reg2,' tpl_evid="{id}" tpl_evkey="{tpl_evkey}" ');
                str.replace(this._reg1,function(a,b,c,d){
                    if(b)a0[a0.length]=b;
                    a1[a0.length]=a0[a0.length]=c;
                    if(d)a0[a0.length]=d;
                    return '';
                });
                return obj;
            }else
                return str;
        },
        _getEV:function(funs, id, name, xid){
            var obj=xui.getNodeData(xid);
            if(!obj)return;

            var evs = this.events,
                tpl_evkey = obj.tpl_evkey,
                evg = (tpl_evkey&&evs&&evs[tpl_evkey])||evs,
                ev = evg&&evg[name];
            if(ev)funs.push(ev);
        },
        _reg3:/(^\s*<\w+)(\s|>)(.*)/,
        _doTemplate:function(properties, tag, result){
            if(!properties)return '';

            var self=this, me=arguments.callee,s,t,n,isA = xui.isArr(properties),
            template = self.$template,
            temp = template[tag||'root'],
            r = !result;

            result= result || [];
            if(isA){
                if(typeof temp != 'function')temp = me;
                for(var i=0;t=properties[i++];){
                    t.tpl_evkey=tag;
                    temp.call(self, t, tag, result);
                }
            }else{
                if(typeof temp == 'function')
                    temp.call(self, properties, tag, result);
                else{
                    tag = tag?tag+'.':'';
                    var a0=temp[0], a1=temp[1];
                    for(var i=0,l=a0.length;i<l;i++){
                        if(n=a1[i]){
                            if(n in properties){
                                t=typeof properties[n]=='function'?properties[n].call(self, n, properties):properties[n];
                                //if sub template exists
                                if(template[s=tag+n])
                                    me.call(self, t, s, result);
                                else
                                    result[result.length]=t;
                            }
                        }else
                            result[result.length]=a0[i];
                    }
                }
            }
            if(r){
                return result.join('')
                    .replace(self._reg3, '$1 id="'+self.$domId+'" $2$3');
            }
        },
        serialize:function(){
            var self=this,
                s=xui.serialize,
                t=xui.absObj.$specialChars,
                properties = xui.isEmpty(self.properties)?null:xui.clone(self.properties,function(o,i){return !t[(i+'').charAt(0)]});            
            return 'new xui.Template(' + 
            s(self.template||null) + "," + 
            s(properties) + "," + 
            s(xui.isEmpty(self.events)?null:self.events) + "," + 
            s(self.$domId!=self.domId?self.domId:null) + 
            ')';
        }
    },
    Static : {
        getFromDom:function(id){
            if((id=typeof id=='string'?id:(id && id.id)) &&(id=xui.$cache.profileMap[id]) && id['xui.Template'])
                return id.boxing();
        },
        _cache:[],
        _ctrlId : new xui.id()
    }
});/*
profile input:
===========================
    [dragType]: String , "move","copy","deep_copy","shape","icon","blank" and "none", default is "shape"
        "blank": moves a empty proxy when mouse moves
        "move": moves target object directly when mouse moves
        "copy": moves a copy of target object when mouse moves
        "deep_copy": moves a deep copy of target object when mouse moves
        "shape": moves a shape of target object when mouse moves
        "icon": moves a icon that represents target object when mouse moves
        "none": moves mouse only
-------------------------
    [dragDefer] :  Number, when [xui.DragDrop.startDrag] is called, the real drag action will be triggered after [document.onmousemove] runs [dragDefer] times, default is 0;
-------------------------
    [magneticDistance]: Number,
    [xMagneticLines]: Array of Number,
    [yMagneticLines]: Array of Number,
        Magnetic setting:
        yMagneticLines 1                      2                     3
              |                      |                     |       xMagneticLines
          ----+----------------------+---------------------+-------1
              |                      |                     |
              |                      |                     |
              |                      |                     |
              |                      |                     |
          ----+----------------------+---------------------+-------2
              |                      |                     |
              |                      |                     |
              |                      |                     |
          ----+----------------------+---------------------+-------3
              |                      |                     |

        magneticDistance
         +-------------
         |*************
         |*************
         |**
         |**
         |**
-------------------------
    [widthIncrement]: Number,
    [heightIncrement]: Number,
        Increment setting:
                   widthIncrement
               <-------------------->
              |                      |                     |
          ----+----------------------+---------------------+-------
              |                      |                     |
heightIncrement|                      |                     |
              |                      |                     |
              |                      |                     |
          ----+----------------------+---------------------+-------
              |                      |                     |
              |                      |                     |
              |                      |                     |
              |                      |                     |
          ----+----------------------+---------------------+-------
              |                      |                     |
              |                      |                     |
-------------------------
    [horizontalOnly]: Number,
    [verticalOnly]: Number,
    horizontalOnly
    ------------------------------------------
                ****************
                ****************
                ****************
                ****************
                ****************
                ****************
    ------------------------------------------
    verticalOnly
               |                |
               |                |
               |****************|
               |****************|
               |****************|
               |****************|
               |****************|
               |****************|
               |                |
               |                |
-------------------------
    [maxBottomOffset]: Number,
    [maxLeftOffset]: Number,
    [maxRightOffset]: Number,
    [maxTopOffset]: Number,
        you can set the limited offset region
        +----------------------------------------------+
        |              |                               |
        |              |maxTopOffset                   |
        |<------------>****************<-------------->|
        |maxLeftOffset**************** maxRightOffset  |
        |              ****************                |
        |              ****************                |
        |              ****************                |
        |              ****************                |
        |              |maxBottomOffset                |
        |              |                               |
        +----------------------------------------------+
-------------------------
    [targetReposition]: <bool>,

    //ini pos and size
    [targetLeft]: Number
    [targetTop]: Number
    [targetWidth]: Number
    [targetHeight]: Number
    [targetCSS]: <object>
        You can set position and size when drag start:
                      targetLeft
                      |
                      |
        targetTop  ---**************** |
                      **************** |
                      **************** |
                      **************** |targetHeight
                      **************** |
                      **************** |
                     |<--targetWidth ->+
-------------------------
    //properties
    [dragCursor]: <string>
-------------------------
    //for drag data
    [dragKey]
    [dragData]

profile output: readonly
===========================
xui.DragDrop.getProfile():
    x  :current X value of mouse;
    y  :current Y value of mouse;
    ox: mouse original X when drag start;
    oy: mouse original Y when drag start;
    curPos:{left:xx,top:xx}: current css pos of the dragging node;
    offset : {x:,y}: offset from now to origin
    restrictedLeft : Number
    restrictedRight : Number
    restrictedTop : Number
    restrictedBottom : Number
    isWorking: Bool.
    proxyNode: xui.Dom object,
    dropElement: String, DOM element id.
*/
xui.Class('xui.DragDrop',null,{
    Static:{
        _eh:"_dd",
        _id:"xui.dd:proxy:",
        _idi:"xui.dd:td:",
        _type:{blank:1,move:1,shape:1,deep_copy:1,copy:1,icon:1,none:1},
        _Icons:{none:'0 0', move:'0 -16px', link:'0 -32px',add:'0 -48px'},
        _profile:{},

        //get left for cssPos
        _left:function(value){
            var proxySize=this.$proxySize;
            with(this._profile){
                if(magneticDistance>0 && xMagneticLines.length){
                    var l=xMagneticLines.length;
                    while(l--)
                        if(Math.abs(value + proxySize - xMagneticLines[l])<=magneticDistance)
                            return xMagneticLines[l] - proxySize;
                }
                if(widthIncrement>1)
                   return Math.floor((value + proxySize)/widthIncrement)*widthIncrement - proxySize;
                return value;
            }
        },
        //get top for cssPos
        _top:function(value){
            var proxySize=this.$proxySize;
            with(this._profile){
                if(magneticDistance>0 && yMagneticLines.length){
                    var l=yMagneticLines.length;
                    while(l--)
                        if(Math.abs(value + proxySize - yMagneticLines[l])<=magneticDistance)
                            return yMagneticLines[l] - proxySize;
                }
                if(heightIncrement>1)
                    return Math.floor((value + proxySize)/heightIncrement)*heightIncrement - proxySize;
                return value;
            }
        },

        _ini:function(o){
            var d=this,p=d._profile,_t=xui.win;

            d._box = { width :_t.width()+_t.scrollLeft(),  height :_t.height()+_t.scrollTop()};

            p.ox = p.x;
            p.oy = p.y;

            if(d._proxy = o){
                d._proxystyle=o.get(0).style;

                //ini cssPos here
                d._profile.curPos = d._cssPos= d._proxy.cssPos();

                d._cssPos_x = p.x - d._cssPos.left;
                d._cssPos_y = p.y - d._cssPos.top;

                p.restrictedLeft = p.x - (p.maxLeftOffset||0);
                p.restrictedRight =  p.x + (p.maxRightOffset||0);
                p.restrictedTop = p.y - (p.maxTopOffset||0);
                p.restrictedBottom = p.y + (p.maxBottomOffset||0);

                //here
                d._proxyLeft = d._pre.left = d._cssPos.left;
                d._proxyTop = d._pre.top = d._cssPos.top;

                if("move" !== p.dragType){
                    d._proxy.css('zIndex',xui.Dom.TOP_ZINDEX*10);
                    xui.setNodeData(d._proxy.get(0),'zIndexIgnore', 1);
                }
            }

        },
        _reset:function(){
            var d=this,NULL=null,FALSE=false;
            //reset
            xui.tryF(d.$reset);
            d.setDropFace();
            d._resetProxy();

            d.$proxySize=50;
            //event
            d.$mousemove=d.$mouseup=d.$onselectstart=d.$ondragstart='*';

            //reset private vars
            d._cursor='';
            d._pre={};
            d._proxyLeft=d._proxyTop=d._cssPos_x=d._cssPos_y=0;
            d._stop=FALSE;
            if(d._onDrag && d._onDrag.tasks){
                d._onDrag.tasks.length=0;
                delete d._onDrag.tasks;
            }
            if(d._onDragover && d._onDragover.tasks){
                d._onDragover.tasks.length=0;
                delete d._onDragover.tasks;
            }
            if(d._c_droppable){d._c_droppable.length=0;}
            d._c_droppable=d._c_dropactive=d._cssPos=d._box=d._dropElement=d._source=d._proxy=d._proxystyle=d._onDrag=d._onDragover=NULL;
            //reset profile
            d._profile={
                // the unqiue id for dd
                $id:xui.rand(),
                dragType:'shape',
                dragCursor:'move',
                targetReposition:true,

                dragIcon:xui.ini.img_dd,
                magneticDistance:0,
                xMagneticLines:[],
                yMagneticLines:[],
                widthIncrement:0,
                heightIncrement:0,
                dragDefer:0,

                horizontalOnly:FALSE,
                verticalOnly:FALSE,
                maxBottomOffset:NULL,
                maxLeftOffset:NULL,
                maxRightOffset:NULL,
                maxTopOffset:NULL,

                targetNode:NULL,
                targetCSS:NULL,
                dragKey:NULL,
                dragData:NULL,
                targetLeft:NULL,
                targetTop:NULL,
                targetWidth:NULL,
                targetHeight:NULL,
                targetOffsetParent:NULL,
                targetCallback:NULL,
                tagVar:NULL,

                shadowFrom:NULL,

                //Cant input the following items:
                proxyNode:NULL,
                x:0,
                y:0,
                ox:0,
                oy:0,
                curPos:{},
                offset:{},
                isWorking:FALSE,
                restrictedLeft:NULL,
                restrictedRight:NULL,
                restrictedTop:NULL,
                restrictedBottom:NULL,
                dropElement:NULL
            };
            d.__touchingfordd=0;
            return d;
        },
        abort:function(){
            this._stop=true;
        },
        _end:function(){
            var d=this,win=window,doc=document,body=doc.body,md="onmousedown",mm="onmousemove",mu="onmouseup",
                mm2,mu2;
            if(xui.browser.isTouch){
                mm2=(xui.browser.ie&&win.PointerEvent)?"onpointermove":(xui.browser.ie&&win.MSPointerEvent)?"onmspointermove":"ontouchmove";
                mu2=(xui.browser.ie&&win.PointerEvent)?"onpointerup":(xui.browser.ie&&win.MSPointerEvent)?"onmspointerup":"ontouchend";
            }
            
            if(d._proxy) d._unpack();

            //must here
            //if bak, restore
            if(d.$onselectstart!='*')body.onselectstart=d.$onselectstart;
            if(d.$ondragstart!='*')doc.ondragstart=d.$ondragstart;
            //if bak, restore
            if(d.$mousemove!='*')doc[mm]=d.$mousemove;
            if(d.$mouseup!='*')doc[mu]=d.$mouseup;
            if(xui.browser.isTouch){
                if(d.$touchmove!='*')doc[mm2]=d.$touchmove;
                if(d.$touchend!='*')doc[mu2]=d.$touchend;                
            }

            return  d;
        },
        startDrag:function(e, targetNode, profile, dragKey, dragData){
            var d=this,win=window,t;
            if(d._profile.isWorking)return false;
            //clear
            d._end()._reset();
            d._profile.isWorking=true;
            d.__touchingfordd = e.type=="xuitouchdown";

            profile=xui.isHash(profile)?profile:{};
            e = e || win.event;
            // not left button
            if(xui.Event.getBtn(e) !== 'left')
               return true;

            d._source = profile.targetNode = xui(targetNode);
            d._cursor = d._source.css('cursor');

            if((t=profile.targetNode.get(0)) && !t.id){
                t.id=xui.Dom._pickDomId();
                t=null;
            }

            //must set here
            d._defer = profile.dragDefer = xui.isNumb(profile.dragDefer) ? profile.dragDefer : 0;
            if(true===profile.dragCursor)profile.dragCursor=d._cursor;
            if(typeof profile.dragIcon == 'string') profile.dragType="icon";

            var doc=document, body=doc.body, _pos = xui.Event.getPos(e),md="onmousedown",mm="onmousemove",mu="onmouseup",
                mm2,mu2;
            if(xui.browser.isTouch){
                mm2=(xui.browser.ie&&win.PointerEvent)?"onpointermove":(xui.browser.ie&&win.MSPointerEvent)?"onmspointermove":"ontouchmove";
                mu2=(xui.browser.ie&&win.PointerEvent)?"onpointerup":(xui.browser.ie&&win.MSPointerEvent)?"onmspointerup":"ontouchend";
            }

            profile.x = _pos.left;
            profile.y = _pos.top;

            profile.dragKey= dragKey || profile.dragKey || null;
            profile.dragData= dragData  || profile.dragData|| null;

            var fromN=xui.Event.getSrc(e);

            d._start=function(e){
//ie6: mousemove - mousedown =>78 ms
//delay is related to window size, weird
            //                  try{
                var p=d._profile;
                //set profile
                xui.merge(p, profile, "with");

                //call event, you can call abort(set _stoop)
                d._source.beforeDragbegin();

                if(d._stop){d._end()._reset();return false}

                //set xui.Event._preDroppable at the begining of drag, for a dd from a child in a droppable node
                if(xui.Event && (t=d._source.get(0))){
                    xui.Event._preDroppable= t.id;
                    t=null;
                }

                //set default icon
                if(p.dragType=='icon')p.targetReposition=false;

                //ini
                d._ini(p.dragType=='none'?null:d._pack(_pos, p.targetNode));
                // on scrollbar
                if(profile.x >= d._box.width  || profile.y >= d._box.height ){d._end()._reset();return true}

                d._source.onDragbegin();

                //set back first
                if(p.dragDefer<1){
                    d.$mousemove = doc[mm];
                    d.$mouseup = doc[mu];
                    if(xui.browser.isTouch){
                        d.$touchmove = doc[mm2];
                        d.$touchend = doc[mu2];
                    }
                }
                //avoid setcapture
                if(xui.browser.ie)
                    xui.setTimeout(function(){if(fromN.releaseCapture)fromN.releaseCapture()});

                //back up
                doc[mm] = d.$onDrag;
                doc[mu] = d.$onDrop;
                if(xui.browser.isTouch){
                    doc[mm2] = d.$onDrag;
                    doc[mu2] = d.$onDrop;
                }
                
                //for events
                d._source.afterDragbegin();
                //for delay, call ondrag now
                if(p.dragDefer>0)d.$onDrag.call(d, e);
                
                // For touch-only platform
                // In ipad or other touch-only platform, you have to decide the droppable order by youself
                // The later added to DOM the higher the priority
                // Add droppable links
                if(xui.browser.isTouch && d.__touchingfordd){
                    d._c_droppable=[];
                    var cdata=xui.$cache.droppable[p.dragKey],purge=[];
                    xui.arr.each(cdata,function(i){
                        if(!xui.use(i).get(0)){
                            purge.push(i);
                            return;
                        }
                        var ni=xui.use(i),h=ni.offsetHeight(),w=ni.offsetWidth(),v=ni.css('visibility'),hash;
                        if(w&&h&&v!='hidden'){
                            hash=ni.offset();
                            hash.width=w;hash.height=h;hash.id=i;
                            d._c_droppable.unshift(hash);
                        }
                    });
                    // self clear
                    if(purge.length){
                        xui.arr.each(purge,function(key){
                            xui.arr.removeValue(cdata,key);
                        });
                    }
                }
            //                  }catch(e){d._end()._reset();}
            };
            if(xui.browser.ie){
                d.$ondragstart=doc.ondragstart;
                d.$onselectstart=body.onselectstart;
                doc.ondragstart = body.onselectstart = null;
                if(doc.selection && doc.selection.empty)try{doc.selection.empty()}catch(e){}            }
            //avoid select
            xui.Event.stopBubble(e);

            //fire document onmousedown event
            if(profile.targetNode.get(0)!==doc)
                xui(doc).onMousedown(true, xui.Event.getEventPara(e, _pos));

            if(profile.dragDefer<1){
                xui.tryF(d._start,[e],d);
                return false;
            }else{
                //for mouseup before drag
                d.$mouseup = doc[mu];
                doc[mu] = function(e){
                    xui.DragDrop._end()._reset();
                    return xui.tryF(document.onmouseup,[e],null,true);
                };
                if(xui.browser.isTouch){
                    d.$touchend = doc[mu2];
                    doc[mu2]=doc[mu];
                }
                var pbak={};
                //for mousemove before drag
                d.$mousemove = doc[mm];
                doc[mm] = function(e){
                    var p=xui.Event.getPos(e);
                    if(p.left===pbak.left&&p.top===pbak.top)return;
                    pbak=p;
                    if(--d._defer<=0)xui.DragDrop._start(e);
                    return false;
                };
                if(xui.browser.isTouch){
                    d.$touchmove = doc[mm2];
                    doc[mm2]=doc[mm];
                }
            }
//ie6: mousemove - mousedown =>78 ms
        },
        $onDrag:function(e){
            var d=xui.DragDrop,p=d._profile;

            if(d.$SimulateMousemoveInMobileDevice)return false;
            
           //try{
                e = e || window.event;
                //set _stop or (in IE, show alert)
                if(!p.isWorking || d._stop){
                //if(!p.isWorking || d._stop || (xui.browser.ie && (!e.button) )){
                    d.$onDrop(e);
                    return true;
                }

                var _pos=xui.Event.getPos(e);
                p.x=_pos.left;
                p.y=_pos.top;

                if(!p.isWorking)return false;

                if(d._proxy){
                    if(!p.verticalOnly){
                        d._proxyLeft=Math.floor(d._left(
                            ((p.maxLeftOffset!==null && p.x<=p.restrictedLeft)?p.restrictedLeft:
                             (p.maxRightOffset!==null && p.x>=p.restrictedRight)?p.restrictedRight : p.x)
                            - d._cssPos_x)
                        );
                        if(d._proxyLeft-d._pre.left)
                            d._proxystyle.left=Math.round(parseFloat(d._proxyLeft))+'px';
                        d._pre.left=d._proxyLeft;
                        p.curPos.left = d._proxyLeft + d.$proxySize;
                    }
                    if(!p.horizontalOnly){
                        d._proxyTop=Math.floor(d._top(
                            ((p.maxTopOffset!==null && p.y<=p.restrictedTop) ? p.restrictedTop :
                             (p.maxBottomOffset!==null && p.y>=p.restrictedBottom) ? p.restrictedBottom : p.y)
                            - d._cssPos_y)
                        );
                        if(d._proxyTop-d._pre.top)
                            d._proxystyle.top=Math.round(parseFloat(d._proxyTop))+'px';
                        d._pre.top=d._proxyTop;
                        p.curPos.top = d._proxyTop + d.$proxySize;
                    }
                }else{
                    p.curPos.left = p.x;
                    p.curPos.top = p.y;
                    //style='none', no dd.current dd._pre provided
                    //fireEvent
                    //d._source.onDrag(true); //shortcut for mousemove
                }
      
                if(d._onDrag!=1){
                    if(d._onDrag)d._onDrag(e,d._source._get(0));
                    else{
                        //ensure to run once only
                        d._onDrag=1;
                        //if any ondrag event exists, this function will set _onDrag
                        d._source.onDrag(true,xui.Event.getEventPara(e, _pos));
                    }
                }
                
                // For touch-only platform
                // In ipad or other touch-only platform, you have to decide the droppable order by youself
                // The later joined the higher the priority
                if(xui.browser.isTouch && d.__touchingfordd){
                    if(d._c_droppable){
                        for(var i=0,l=d._c_droppable.length;i<l;i++){
                            var o=d._c_droppable[i],
                                target=xui.use(o.id).get(0),
                                oactive=d._c_dropactive,
                                otarget=xui.use(oactive).get(0);

                            if(p.x>=o.left&&p.y>=o.top&&p.x<=(o.left+o.width)&&p.y<=(o.top+o.height)){
                                if(oactive==o.id){
                                    //console.log('in ' +o.id );
                                    var first = e.changedTouches[0];
                                    d.$SimulateMousemoveInMobileDevice=1;
                                    xui.Event.simulateEvent(target,"mousemove",{screenX:first.screenX, screenY:first.screenY, clientX:first.clientX, clientY:first.clientY});
                                    delete d.$SimulateMousemoveInMobileDevice;
                                }else{
                                    xui.Event.simulateEvent(target,"mouseover",{screenX:p.left, screenY:p.top, clientX:p.left, clientY:p.top});
                                    d._c_dropactive=o.id;

                                    //console.log('active ' +o.id);
                                    if(oactive && otarget){
                                        xui.Event.simulateEvent(otarget,"mouseout",{screenX:p.left, screenY:p.top, clientX:p.left, clientY:p.top});
                                        //console.log('deactive ' + oactive);
                                    }
                                }
                                break;
                            }else{
                                if(oactive==o.id){
                                    if(otarget){
                                        xui.Event.simulateEvent(otarget,"mouseout",{screenX:p.left, screenY:p.top, clientX:p.left, clientY:p.top});
                                    }
                                    d._c_dropactive=null;
                                    //console.log('deactive ' + oactive);
                                    break;
                                }
                            }
                        }
                    }
                }
                    
            //}catch(e){xui.DragDrop._end()._reset();}finally{
               return false;
            //}
        },
        $onDrop:function(e){
            var d=xui.DragDrop,p=d._profile,evt=xui.Event;
//                try{
                e = e || window.event;

                // opera 9 down with
                // if(!isWorking){evt.stopBubble(e);return false;}
                d._end();
                if(p.isWorking){

                    //here, release drop face first
                    //users maybe use html() function in onDrop function
                    d.setDropFace();

                    var r = d._source.onDragstop(true,evt.getEventPara(e));
                    if(d._dropElement)
                        xui.use(d._dropElement).onDrop(true,evt.getEventPara(e));
                }
//                }catch(a){}finally{
                d._reset();
                evt.stopBubble(e);
                xui.tryF(document.onmouseup,[e]);
                return !!r;
//                }
        },
        setDropElement:function(id){
            this._profile.dropElement=this._dropElement=id;
            return this;
        },
        getProfile:function(){
            var d=this,p=d._profile;
            p.offset=d._proxy
            ?
            { x : d._proxyLeft-p.ox+d._cssPos_x,  y : d._proxyTop-p.oy+d._cssPos_y}
            :
            { x : p.x-p.ox,  y : p.y-p.oy}
            ;
            return p;
        },
        setDropFace:function(target, dragIcon){
            var d=this,
                s1='<div style="position:absolute;z-index:'+xui.Dom.TOP_ZINDEX+';font-size:0;line-height:0;border-',
                s2=":dashed 1px #ff6600;",
                region=d._Region,rh=d._rh, st, sl, 
                bg='backgroundColor';
            if(region && region.parent())
                region.remove(false);
            if(d._R){
                d._R.css(bg, d._RB);
                delete d._R;
                delete d._RB;
            }

            if(target){
                //never create, or destroy the region
                if(!region || !region.get(0)){
                    region=d._Region=xui.create(s1+'top:solid 2px #ff6600;left:0;top:0;width:100%;height:0;"></div>'+s1+'right'+s2+'right:0;top:0;height:100%;width:0;"></div>'+s1+'bottom'+s2+'bottom:0;left:0;width:100%;height:0;"></div>'+s1+'left'+s2+'width:0;left:0;top:0;height:100%;"></div>');
                    rh=d._rh=xui([region.get(1),region.get(3)]);
                }
                target=xui(target);
                if(xui.browser.ie6)rh.height('100%');
                if(target.css('display')=='block'){
                    xui.setNodeData(region.get(0),'zIndexIgnore', 1);
                    target.append(region);
                    // ensure in the view
                    region.top(st=target.scrollTop()).left(sl=target.scrollLeft());
                    region.get(2).style.top='auto';region.get(1).style.left='auto';
                    region.get(2).style.bottom='-'+st+'px';
                    region.get(1).style.right='-'+sl+'px';

                    if(xui.browser.ie6 && !rh.get(0).offsetHeight)
                        rh.height(target.get(0).offsetHeight);
                }else{
                    d._RB = target.get(0).style[bg];
                    d._R=target;
                    target.css(bg, '#FA8072');
                }
                d.setDragIcon(dragIcon||'move');
            }else
                d.setDragIcon('none');
            return d;
        },
        setDragIcon:function(key){
            //avoid other droppable targetNode's setDropFace disturbing.
            xui.resetRun('setDropFace', null);
            var d=this,p=d._profile,i=p.proxyNode,ic=d._Icons;
            if(i && p.dragType=='icon')
                i.first(4).css(typeof key=='object'?key:{backgroundPosition: (ic[key]||key)});
            return d;
        },
        _setProxy:function(child, pos){
            var t,temp,d=this,p=d._profile,dom=xui.Dom;
            if(!dom.byId(d._id))
                xui('body').prepend(
                    //&nbsp; for IE6
                    xui.create('<div id="' + d._id + '" style="left:0;top:0;border:0;font-size:0;line-height:0;padding:'+d.$proxySize+'px;position:absolute;background:url('+xui.ini.img_bg+') repeat;"><div style="font-size:0;line-height:0;" id="' +d._idi+ '">'+(xui.browser.ie6?'&nbsp;':'')+'</div></div>')
                );
            t=xui(d._id);
            //t.rotate('10');
            if(p.dragKey){
                d.$proxySize=0;
                t.css('padding',0);
            }else{
                pos.left -=  d.$proxySize;
                pos.top -= d.$proxySize;
                if(!p.targetOffsetParent)
                    dom.setCover(true,null,false,p.dragCursor);
            }
            if(temp=p.targetOffsetParent)
                xui(temp).append(t);

            if(child){
                xui(d._idi).empty(false).append(child);
                p.proxyNode = child;
            }else
                p.proxyNode = xui(d._idi);
            t.css({display:'',zIndex:dom.TOP_ZINDEX*10,cursor:p.dragCursor}).offset(pos, temp);
            xui.setNodeData(t.get(0),'zIndexIgnore', 1);

            return t;
        },
        _resetProxy:function(){
            var d=this, p=d._profile,
                dom=xui.Dom,
                id1=d._id,
                id2=d._idi;
            if(dom.byId(id1)){
                var t,k,o=xui(id2),t=xui(id1);
                //&nbsp; for IE6
                if(xui.browser.ie6)
                    o.html('&nbsp;');
                else o.empty();
                o.attr('style','font-size:0;line-height:0;');
                //o.rotate(0);
                xui('body').prepend(
                    t
                    .css({
                        zIndex:0,
                        cursor:'',
                        display:'none',
                        padding:Math.round(parseFloat(d.$proxySize))+'px'
                    })
                );
                p.proxyNode=d._proxystyle=null;
                dom.setCover(false);
            }
        },
        _pack:function(mousePos,targetNode){
            var target, pos={}, size={}, d=this, p=d._profile, t;
            // get abs pos (border corner)
            if(p.targetLeft===null || null===p.targetTop)
                t=targetNode.offset(null, p.targetOffsetParent);
            pos.left = null!==p.targetLeft?p.targetLeft: t.left;
            pos.top = null!==p.targetTop?p.targetTop: t.top;

            switch(p.dragType){
                case 'deep_copy':
                case 'copy':
                   var t;
                    size.width =  xui.isNumb(p.targetWidth)? p.targetWidth:(targetNode.cssSize().width||0);
                    size.height = xui.isNumb(p.targetHeight)?p.targetHeight:(targetNode.cssSize().height||0);
                    var n=targetNode.clone(p.dragType=='deep_copy')
                        .css({position:'relative',margin:'0',left:'0',top:'0',right:'',bottom:'',cursor:p.dragCursor,'cssFloat':'none'})
                        .cssSize(size)
                        .id('',true)
                        .css('opacity',0.8);

                    if(p.targetCallback)
                        p.targetCallback(n);

                    n.query('*').id('',true);
                    if(p.targetCSS)
                        n.css(p.targetCSS);
                    target = d._setProxy(n,pos);
                    break;
                case 'shape':
                    // get size
                    size.width = null!==p.targetWidth?p.targetWidth:targetNode.offsetWidth();
                    size.height = null!==p.targetHeight?p.targetHeight:targetNode.offsetHeight();
                    size.width-=2;size.height-=2;
                    target = d._setProxy(
                        xui.create('div').css({border:'dashed 1px',fontSize:'0',lineHeight:'0'}).cssSize(size)
                        ,pos);
                    break;
                case 'blank':
                    target = d._setProxy(null,pos);
                    break;
                case 'icon':
                    pos.left=xui.isNumb(p.targetLeft)?p.targetLeft:(mousePos.left /*- xui.win.scrollLeft()*/ + 16);
                    pos.top=xui.isNumb(p.targetTop)?p.targetTop:(mousePos.top /*- xui.win.scrollTop()*/ + 16);
                    t='<table border="0" class="xui-node xui-node-table"><tr><td valign="top"><span class="xui-node xui-node-span" style="background:url('+p.dragIcon+') no-repeat left top;width:'+(xui.isNumb(p.targetWidth)?p.targetWidth:16)+'px;height:'+(xui.isNumb(p.targetHeight)?p.targetHeight:16)+'px;" ></span></td><td id="xui:dd:shadow" '+(p.shadowFrom?'style="border:solid 1px #e5e5e5;background:#fff;font-size:12px;line-height:14px;"':'')+'>'+(p.shadowFrom?

                    xui(p.shadowFrom).clone(true)
                    .css({left:'auto',top:'auto', position:'relative'})
                    .outerHTML().replace(/\s*id\=[^\s\>]*/g,''):'')

                    +'</td></tr></table>';
                    target = d._setProxy(xui.create(t).css('opacity',0.8), pos);
                    break;
                case 'move':
                    d.$proxySize=0;
                    target=targetNode;
                    if(target.css('position') != 'absolute')
                        target.css('position','absolute').offset(pos);
                    target.css('cursor',p.dragCursor);
            }

            return target;
        },
        _unpack:function(){
            var d=this, p=d._profile, t,f;
            if(p.targetReposition && ("move" != p.dragType)){
                if((t=xui(d._source)))
                    if(!t.isEmpty()){
                        if(t.css('position')!= 'absolute')
                            t.css('position','absolute').cssPos(t.offset(null,t.get(0).offsetParent ));

                        //for ie bug
                        if(xui.browser.ie)
                            t.cssRegion({right:'',bottom:''});
                        t.offset(p.curPos, p.targetOffsetParent||document.body);
                    }
            }
            if("move" == p.dragType)
                d._source.css('cursor',d._cursor);
        },
        _unRegister:function(node, key){
            var eh=this._eh;
            xui([node])
                .$removeEvent('beforeMouseover', eh)
                .$removeEvent('beforeMouseout', eh)
                .$removeEvent('beforeMousemove', eh);

            var o=xui.getNodeData(node.$xid, ['_dropKeys']),c=xui.$cache.droppable;            
            if(o)
                for(var i in o)
                    if(c[i])
                        xui.arr.removeValue(c[i],node.$xid);

            xui.setNodeData(node.$xid, ['_dropKeys']);
        },
        _register:function(node, key){
            var eh=this._eh;
            xui(node)
                .beforeMouseover(function(p,e,i){
                    var t=xui.DragDrop, p=t._profile;
                    if(p.dragKey && xui.getNodeData(i,['_dropKeys', p.dragKey])){
                        t.setDropElement(i);
                        t._onDragover=null;
                        xui.use(i).onDragenter(true);
                        if(t._dropElement)
                            xui.resetRun('setDropFace', t.setDropFace, 0, [i], t);
                    }
                }, eh)
                .beforeMouseout(function(p,e,i){
                    var t=xui.DragDrop,p=t._profile;
                     if(p.dragKey && xui.getNodeData(i,['_dropKeys', p.dragKey])){
                        xui.use(i).onDragleave(true);
                        if(t._dropElement==i){
                            t.setDropElement(t._onDragover=null);
                            xui.resetRun('setDropFace', t.setDropFace, 0, [null], t);
                        }
                    }
                }, eh)
                .beforeMousemove(function(a,e,i){
                    var t=xui.DragDrop, h=t._onDragover, p=t._profile;
                    //no dragover event
                    if(h==1)return;
                    if(t._dropElement==i && p.dragKey && xui.getNodeData(i,['_dropKeys', p.dragKey])){
                        if(h)h(e,i);
                        else{
                            //ensure to run once only
                            t._onDragover=1;
                            //if any dragover event exists, this function will set _onDragover
                            xui.use(i).onDragover(true,xui.Event.getEventPara(e));
                        }
                    }
                }, eh);

            var o=xui.getNodeData(node.$xid, ['_dropKeys']),c=xui.$cache.droppable;            
            if(o)
                for(var i in o)
                    if(c[i])
                        xui.arr.removeValue(c[i],node.$xid);

            var h={},a=key.split(/[^\w-]+/)
            for(var i=0,l=a.length;i<l;i++){
                h[a[i]]=1;
                c[a[i]]=c[a[i]]||[];
                c[a[i]].push(node.$xid);
            }
            xui.setNodeData(node.$xid, ['_dropKeys'], h);
            
        }
    },
    After:function(){
        this._reset();
        //add dom dd functions
        xui.each({
            startDrag:function(e, profile, dragKey, dragData){
                xui.DragDrop.startDrag(e, this.get(0), profile, dragKey||'', dragData||null);
                return this;
            },
            draggable:function(flag, profile, dragKey, dragData, target){
                var self=this,
                    target=target?typeof(target)=="function"?xui.tryF(getTarget,[],this):xui(target):null, 
                    dd=xui.DragDrop;
                if(!target || !target.get(0)){
                    target=self;
                }
                self.removeClass('xui-ui-selectable').addClass('xui-ui-unselectable')
                if(flag===undefined)
                    flag=true;
                else if(typeof flag=='object'){
                    profile=flag;
                    flag=true;
                }
                var f=function(p,e,src){
                    if(xui.getId(xui.Event.getSrc(e))!=src)return true;
                    target.startDrag(e, profile, dragKey, dragData);
                };

                if(!!flag){
                    self.$addEvent('beforeMousedown',f, dd._eh, -1);
                }else{
                    self.$removeEvent('beforeMousedown', dd._eh);
                }

                return self;
            },
            droppable:function(flag, key){
                if(flag===undefined)flag=true;
                key = key || 'default';
                var d=xui.DragDrop;
                return this.each(function(o){
                    if(!!flag)
                        d._register(o, key);
                    else
                        d._unRegister(o, key);
                });
            }
        },function(o,i){
            xui.Dom.plugIn(i,o);
        });
    }
});xui.Class("xui.Cookies", null,{
    Static:{
        set:function(name,value,days,path,domain,isSecure){
            if(xui.isHash(name)){
                for(var i in name) this.set(i, name[i],days,path,domain,isSecure);
           }else{
	           if(typeof value !="string")value=xui.serialize(value);
    	       document.cookie = escape(name+'') + "=" + escape(value) +
    		        (days?"; expires="+(new Date((new Date()).getTime()+(24*60*60*1000*days))).toGMTString():"")+
    		        (path?"; path="+path:"")+
    		        (domain?"; domain="+domain:"")+ 
    		        (isSecure?"; secure":"");
    	    }
            return this;
        },
        get:function(name){
        	var i,a,s,ca = document.cookie.split( "; " ),hash={},unserialize=function(v){
                return  /^\s*\{[\s\S]*\}$/.test(v) ? xui.unserialize(v) : /^\s*\[[\s\S]*\]$/.test(v) ? xui.unserialize(v) : v;
            };
        	for(i=0;i<ca.length;i++){
        		a=ca[i].split("=");
    	        s=a[1]?unescape(a[1]):'';
    	        hash[a[0]] = unserialize(s)||s;
        		if(name && a[0]==escape(name))
        		    return hash[a[0]];
        	}
        	return name?null:hash;
        },
        remove:function(name){
        	return this.set(name,"",-1).set(name,"/",-1);
        },
        clear:function(){
            xui.arr.each(document.cookie.split(";"),function(o){
                xui.Cookies.remove(xui.str.trim(o.split("=")[0]));
            });
        }
    }
});xui.Class("xui.History",null,{
    Static:{
        activate:function(){
            var self=this;
            if(self._activited)return;
            self._activited=1;
            switch(self._type){
                case 'event':
                    xui.Event._addEventListener(window, "hashchange",self._checker);
                break;
                case "iframe":
                    document.body.appendChild(document.createElement('<iframe id="'+self._fid+'" src="about:blank" style="display: none;"></iframe>'));
                    var doc=document.getElementById(self._fid).contentWindow.document;
                    doc.open("javascript:'<html></html>'");
                    doc.write("<html><head><scri" + "pt type=\"text/javascript\">parent.xui.History._checker('"+hash+"');</scri" + "pt></head><body></body></html>");
                    doc.close();
                case 'timer':
                    if(self._itimer)
                        clearInterval(self._itimer);
                    self._itimer = setInterval(self._checker, 200);
                break;
            }
        },
        _fid:'xui:history',
        _type:(xui.browser.ie && (xui.browser.ver<8))?'iframe':("onhashchange" in window)?'event':'timer',
        _callbackTag:null,
        _callbackArr:null,
        _inner_callback:null,
        _callback:function(fragment, init, newAdd){
            var ns=this, arr, f;
            xui.arr.each(xui.Module._cache,function(m){
              // by created order    
               if(m._evsClsBuildIn && ('onFragmentChanged' in m._evsClsBuildIn)){
                   // function or pseudocode
                   if(xui.isFun(f = m._evsClsBuildIn.onFragmentChanged) || (xui.isArr(f) && f[0].type)){
                       m.fireEvent('onFragmentChanged', [m,fragment, init, newAdd]);
                   }
               }
               else if(m._evsPClsBuildIn && ('onFragmentChanged' in m._evsPClsBuildIn)){
                   // function or pseudocode
                   if(xui.isFun(f = m._evsPClsBuildIn.onFragmentChanged) || (xui.isArr(f) && f[0].type)){
                       m.fireEvent('onFragmentChanged', [m,fragment, init, newAdd]);
                   }
               }
            });
            // tag
            if(xui.isFun(ns._callbackTag) && false===ns._callbackTag(fragment, init, newAdd))return;
            // tagVar
            arr = ns._callbackArr;
            if(arr&&xui.isArr(arr)){
                for(var i=0,l=arr.length;i<l;i++){
                    if(xui.isFun(arr[i]) && false===arr[i](fragment, init, newAdd))
                        return;
                }
            }
            // the last one
            if(xui.isFun(ns._inner_callback))ns._inner_callback(fragment, init, newAdd);
        },
        /* set callback function
        callback: function(hashStr<"string after #!">)
        */
        setCallback: function(callback){
            var self=this,
                hash = location.hash;
            if(hash)hash='#!' + encodeURIComponent((''+decodeURIComponent(hash)).replace(/^#!/,''));
            else hash="#!";
            self._inner_callback = callback;

            self._lastFI = decodeURIComponent(hash);

            self._callback(decodeURIComponent(self._lastFI.replace(/^#!/, '')), true, callback);

            return self;
        },
        _checker: function(hash){
            var self=xui.History;
            switch(self._type){
                case "iframe":
                    if(xui.isSet(hash))
                        location.hash=hash;
                case 'event':
                case 'timer':
                    if(decodeURIComponent(location.hash) != decodeURIComponent(self._lastFI)) {
                        self._lastFI = decodeURIComponent(location.hash);
                        self._callback(decodeURIComponent(location.hash.replace(/^#(!)?/, '')));
                    }
                break;
            }
        },
        getFI:function(){
            return this._lastFI;
        },
        /*change Fragement Identifier(string after '#!')
        */
        setFI:function(fi,triggerCallback,merge){
            var self=this;
            
            self.activate();

            // ensure encode once
            if(fi){
                if(!xui.isHash(fi))fi=xui.urlDecode((fi+'').replace(/^#!/,'')); //encodeURIComponent((''+decodeURIComponent(fi)).replace(/^#!/,''));
                if(merge)fi = xui.merge(fi, xui.getUrlParams(), 'without');
                fi='#!' + xui.urlEncode(fi);
            }else{
                fi="#!";
            }
            if(self._lastFI == decodeURIComponent(fi))return false;

            switch(self._type){
                case "iframe":
                    var doc=document.getElementById(self._fid).contentWindow.document;
                    doc.open("javascript:'<html></html>'");
                    doc.write("<html><head><scri" + "pt type=\"text/javascript\">parent.xui.History._checker('"+fi+"');</scri" + "pt></head><body></body></html>");
                    doc.close();
                break;
                case 'event':
                case 'timer':
                    location.hash = self._lastFI = decodeURIComponent(fi);
                if(triggerCallback!==false)
                    self._callback(decodeURIComponent(fi.replace(/^#!/,'')));
                break;
            }
        }
    }
});//singleton
xui.Class("xui.Tips", null,{
    Constructor:function(){return null},
    Initialize:function(){
        if(xui.ini.disableTips || xui.browser.fakeTouch)return;
        var dd=xui.DragDrop,
            tips=this;
        if(dd)
            dd.$reset=function(){
                tips._pos={left:dd._profile.x,top:dd._profile.y}
            };

        //for: span(display:-moz-inline-box) cant wrap in firefox
        xui.CSS.addStyleSheet(
            ".xui-tips{position:absolute;overflow:visible;visibility:hidden;left:-10000px;border-radius:1px;} "+
            ".xui-tips-i{overflow:hidden;position:relative;}"+
            ".xui-tips-i span{display:inline;}"+
            ".xui-tips-c{padding:.125em .25em .25em .25em;}"+
            ".xui-tips-c *{line-height:1.22em;}"+
            ".xui-tips .xui-tips-c{border-radius:1px;}"
        , this.KEY);

        xui.doc
        .afterMousedown(function(){
            tips._cancel();
        },'$Tips',-1)
        .afterMousemove(function(obj, e){
            if(dd.isWorking)return;
            var event=xui.Event,p,n;

            if((p=xui.resetRun.$cache) && p['$Tips']){
                tips._pos=event.getPos(e);
            }

            //it's first show
            if(tips._from){
                tips._pos=event.getPos(e);
                tips._showF();
                xui.resetRun('$Tips3');
            //after show, before hide
            }else if(tips._showed && tips.MOVABLE){
                p=event.getPos(e);
                n=tips._Node.style;
                n.left = Math.min(tips._tpl._ww-tips._tpl._w, Math.max(0, Math.round((parseFloat(n.left)||0) + (p.left-tips._pos.left), 10))) + 'px';
                n.top = Math.min(tips._tpl._hh-tips._tpl._h, Math.max(0, Math.round((parseFloat(n.top)||0) + (p.top-tips._pos.top), 10))) + 'px';
                
                tips._pos=p;
            }
        },'$Tips',-1)
        .afterMouseover(function(obj, e){
            var event=xui.Event,
                rt=event.$FALSE,
                node=event.getSrc(e),
                id,
                _from,
                tempid,evid,
                index=0,
                pass,
                rtn=function(rt){
                    if(tips._markId)tips._cancel()
                    return rt;
                };
            if(!node)
                return rtn(rt);
            try{
                //for inner renderer
                while((!node.id || node.id==xui.$localeDomId) && node.parentNode!==document && index++<10)
                    node=node.parentNode;
                if(!(id=(typeof node.id=="string"?node.id:null))){
                    node=null;
                    return rtn(rt);
                }
            }catch(e){}

            //check id
            if((_from=event._getProfile(id)) && _from.box && _from.KEY=='xui.UIProfile'){
                if(_from.properties.disableTips || _from.behavior.disableTips){
                    node=null;
                    return rtn(false);
                }

                var nt=_from.behavior.NoTips;
                if(nt){
                    for(var i=0,l=nt.length;i<l;i++){
                        if(id.indexOf(_from.keys[nt[i]])===0)
                            return rtn(false);
                    }
                }
                nt=_from.behavior.PanelKeys;
                if(nt){
                    for(var i=0,l=nt.length;i<l;i++){
                        if(id.indexOf(_from.keys[nt[i]])===0)
                            return rtn(false);
                    }
                }
                nt=_from.behavior.HoverEffected;
                //if onShowTips exists, use seprated id, or use item scope id
                tempid=_from.onShowTips?id:id.replace(tips._reg,
                //if HoverEffected exists, use seprated id
                function(a,b){
                    return nt&&(b in nt)?a:':';
                });
                if(tips._markId && tempid==tips._markId)
                    return rt;

                //set mark id
                tips._markId = tempid;
                tips._pos=event.getPos(e);

                if(tips._showed){
                    tips._from=_from;
                    tips._enode=id;
                    tips._showF();
                }else
                    xui.resetRun('$Tips', function(){
                        tips._from=_from;
                        tips._enode=id;
                        // if mouse stop move
                        xui.resetRun('$Tips3', function(){
                            if(tips._from)
                                tips._showF();
                        });
                    }, tips.DELAYTIME);
            }else
                tips._cancel();

            node=null;
            return rt;
        },'$Tips',-1)
        .afterMouseout(function(obj, e){
            if(tips._markId){
                var event=xui.Event,
                    id,
                    clear,
                    index=0,
                    node = e.toElement||e.relatedTarget;

                if(!node)
                    clear=1;
                else{
                    //for firefox wearing anynomous div in input/textarea
                    try{
                        //for inner renderer
                        while((!node.id || node.id==xui.$localeDomId) && node.parentNode!==document && index++<10)
                            node=node.parentNode;
                        if(!(id=(typeof node.id=="string"?node.id:null))){
                            node=null;
                            clear=1;
                        }
                    }catch(e){clear=1}
                }
                if(clear)
                    tips._cancel();
                return event.$FALSE;
            }
        },'$Tips',-1)
        .afterMouseup(function(obj, e){
            tips._cancel();
        },'$Tips',-1);

        this._Types = {
            'default' : new function(){
                this.show=function(item, pos, key){
                    //if trigger onmouseover before onmousemove, pos will be undefined
                    if(!pos)return;

                    var self=this,node,_ruler,s,w,h;
                    if(!(node=self.node) || !node.get(0)){
                        node = self.node = xui.create('<div class="xui-node xui-node-div xui-tips  xui-ui-shadow xui-custom"><div class="xui-node xui-wrapper xui-node-div xui-tips-i xui-custom"></div></div>');
                        _ruler = self._ruler = xui.create('<div class="xui-node xui-wrapper xui-node-div xui-tips  xui-ui-shadow xui-custom"><div class="xui-node xui-node-div xui-tips-i xui-custom"></div></div>');
                        self.n = node.first();
                        self._n = _ruler.first();
                        xui('body').append(_ruler);
                    }
                    _ruler = self._ruler;
                    //ensure zindex is the top
                    if(document.body.lastChild!=node.get(0))
                        xui('body').append(node,false,true);

                    s = typeof item=='object'? item[key||xui.Tips.TIPSKEY] :item ;
                    if(typeof s=='function')
                        s=s();
                    if(s+=""){
                        var html=/^\s*\</.test(s);
                        //get string
                        s=xui.adjustRes(s);
                        xui.Tips._curTips=s;
                        if(!item.transTips || !html)
                            s='<div class="xui-ui-ctrl xui-node xui-node-div  xui-uiborder-flat xui-uicell-alt xui-node-tips xui-tips-c /*xui-cls-wordwrap */xui-custom">'+s+'</div>';
                        //set to this one
                        self._n.get(0).innerHTML=s;

                        self._ww=xui.frame.width();
                        self._hh=xui.frame.height();

                        //get width
                        w=Math.min(html?self._ww:tips.MAXWIDTH, _ruler.get(0).offsetWidth + 2);

                        //set content, AND dimension
                        var style=node.get(0).style, t1=self.n.get(0),styleI=t1.style;
                        //hide first
                        style.visibility='hidden';
                        //set content
                        t1.innerHTML=s;
                        //set dimension
                        if(xui.browser.ie){
                            style.width=styleI.width=(self._w=Math.round(w+(w%2)))+'px';
                            h=t1.offsetHeight;
                            style.height=(self._h=Math.round(h-(h%2)))+'px';
                        }else{
                            styleI.width=(self._w=Math.round(w))+'px';
                            self._h=self.n.height();
                        }

                        if(pos===true){
                            style.visibility='visible';
                        }else{
                            //pop(visible too)
                            node.popToTop((pos['xui.UI'] || pos['xui.UIProfile'] || pos['xui.Dom'] || pos.nodeType==1 || typeof pos=='string')?pos:{left:pos.left,top:pos.top,region:{
                                left:pos.left,
                                top:pos.top-12,
                                width:24,
                                height:32
                            }},1);
                        }
                        
                        style=styleI=t1=null;
                    }else
                        node.css('zIndex',0).hide();
                };
                this.hide = function(){
                    this.node.css('zIndex',0).hide();
                };
            }/*,
            'animate' : new function(){
                this.threadid='$tips:1$';
                this.show=function(item, pos){
                    if(!this.node){
                        this.node = xui.create('<div class="xui-node xui-node-div xui-custom" style="position:absolute;border:solid gray 1px;background-color:#FFF1A0;padding:.5em;overflow:hidden;"></div>');
                        xui('body').append(this.node);
                    }
                    pos.left+=12;
                    pos.top+=12;
                    var s=item.tips;
                    s = s.charAt(0)=='$'?xui.wrapRes(s.slice(1)):s;
                    this.node.html(s).css('zIndex',xui.Dom.TOP_ZINDEX).cssPos(pos);
                    var w=this.node.width(),h=this.node.height();
                    this.node.cssSize({ width :0, height :0}).css('display','block').animate({width:[0,w],height:[0,h]},0,0,300,0,'expoOut',this.threadid).start();
                };
                this.hide = function(){
                    xui.Thread.abort(this.threadid);
                    this.node.height('auto').width('auto').css('display','none').css('zIndex',0);
                };
            }*/
        };
    },
    Static:{
        _reg:/-([\w]+):/,
        TIPSKEY:'tips',
        MAXWIDTH:600,
        MOVABLE:true,
        DELAYTIME:400,
        AUTOHIDETIME:5000,

        _showF:function(){
            if(xui.ini.disableTips || xui.browser.fakeTouch)return;
            var self=this,
                _from=self._from,
                node=xui.Dom.byId(self._enode),
                pos=self._pos,
                id,
                o,t,b=true;

            self._from=self._enode=null;

            if(!node || !_from || !pos || !(o=_from.box))return;

            //1.CF.showTips
            b=false!==((t=_from.CF) && (t=t.showTips) && t(_from, node, pos));
            //2._showTips / onShowTips
            //check if showTips works
            if(b!==false)b=false!==(_from._showTips && _from._showTips(_from, node, pos));
            //check if showTips works
            if(b!==false)b=false!==(o._showTips && o._showTips(_from, node, pos));

            //default tips var(profile.tips > profile.properties.tips)
            if(b!==false){
                if(((t=_from) && t.tips)||(t && (t=t.properties) && t.tips)){
                    self.show(pos, t);
                    b=false;
                }
                else if((t=_from) && (t=t.properties) && t.autoTips && ('caption' in t)
                    // if tips is default value, try to show caption
                    // you can settips to null or undefined to stop it
                    && t.tips===''
                    ){
                    if(t.caption||t.labelCaption){
                        self.show(pos, {tips:t.caption||t.labelCaption});
                        b=false;
                    }
                }
            }

            //no work hide it
            if(b!==false){
                self.hide();
            }else {
                if(!self.MOVABLE)
                    xui.resetRun('$Tips2', self.hide,self.AUTOHIDETIME,null,self);
            }
            node=pos=_from=null;
        },
        getTips:function(){
            return this._curTips;
        },
        setTips:function(s){
            if(this._curTips && this._tpl&& this._Node){
                this._tpl.show(s, true);
            }
        },
        setPos:function(left,top){
            var n=this;
            if((n=n._Node)&&(n=n.style)){
                if(left||left===0)n.left=Math.round(parseFloat(left))+'px';
                if(top||top===0)n.top=Math.round(parseFloat(top))+'px';
            }
        },
        show:function(pos, item, key){
            var self=this,t;
            //for mousemove
            self._pos=pos;
            //same item, return
            if(self._item === item)return;

            //hide first
            //if(self._tpl)self._tpl.hide();

            //base check
            if(typeof item =='string' || (item && (item[key||xui.Tips.TIPSKEY]))){
                //get template
                t = self._tpl = self._Types[item.tipsTemplate] || self._Types['default'];
                t.show(item,pos,key);
                self._Node=t.node.get(0);
                self._item=item;
                self._showed = true;
            }else
                self._cancel();
        },
        hide:function(){
            var self=this;
            if(self._showed){
                if(self._tpl)self._tpl.hide();
                self._clear();
            }
        },
        _cancel:function(){
            var self=this;
            if(self._markId){
                if(self._showed){
                    self.hide();
                }else{
                    xui.resetRun('$Tips');
                    xui.resetRun('$Tips3');
                    self._clear();
                }
            }
        },
        _clear:function(){
            var self=this;
            self._Node=self._curTips=self._markId = self._from=self._tpl = self._item = self._showed = null;
        }
    }
});        if(!('Class' in window))window.Class=function(){return xui.Class.apply(xui.Class,arguments);};

    if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = xui;
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(function() { return xui; });
    }
}).call(this || (typeof window !== 'undefined' ? window : global));