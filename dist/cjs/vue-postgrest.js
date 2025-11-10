"use strict";
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _options, _proxy, _GenericModel_instances, request_fn, _options2, _proxy2, _range, _apiRoot, _apiRoot2, _token;
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const vue = require("vue");
function mapAliasesFromSelect(select = [], data) {
  const kvPairs = Array.isArray(select) ? select.map((k) => [k, true]) : typeof select === "string" ? select.split(",").map((k) => [k, true]) : Object.entries(select);
  const alias2column = new Map(
    kvPairs.map(([k, v]) => {
      if (!v) return false;
      const [alias, column] = k.split(":");
      return [alias, column ?? alias];
    }).filter(Boolean)
  );
  return Object.fromEntries(Object.entries(data).map(([alias, value]) => [alias2column.get(alias) ?? alias, value]));
}
function reflectHelper(keys, ret, target, property, ...args) {
  if (keys.includes(property)) return ret;
  return Reflect[this](target, property, ...args);
}
const $diff = Symbol("diff");
const $freeze = Symbol("freeze");
const $isDiffProxy = Symbol("isDiffProxy");
function createDiffProxy(target, parentDirty = false) {
  const base = Array.isArray(target) ? [] : {};
  copy(target, base);
  return new Proxy(target, {
    get(target2, property, receiver) {
      switch (property) {
        case $diff:
          return Object.fromEntries(
            Object.entries(target2).filter(([k, v]) => v !== base[k] || v && v[$isDiffProxy] && v.$isDirty)
          );
        case $freeze:
          return () => {
            parentDirty = false;
            copy(target2, base, $freeze);
          };
        case $isDiffProxy:
          return true;
        case "$isDirty":
          if (parentDirty) return true;
          if (Array.isArray(target2)) {
            if (target2.length !== base.length) return true;
            return target2.filter((v, k) => v !== base[k] || v && v[$isDiffProxy] && v.$isDirty).length > 0;
          } else {
            if (Object.keys(base).filter((k) => !(k in target2)).length > 0) return true;
            return Object.entries(target2).filter(([k, v]) => v !== base[k] || v && v[$isDiffProxy] && v.$isDirty).length > 0;
          }
        case "$reset":
          return () => copy(base, target2, "$reset");
      }
      return Reflect.get(target2, property, receiver);
    },
    set(target2, property, value, receiver) {
      if (typeof value === "object" && value !== null && !value[$isDiffProxy]) {
        value = createDiffProxy(value, true);
      }
      return reflectHelper.call("set", [$diff, $freeze, $isDiffProxy, "$isDirty", "$reset"], false, target2, property, value, receiver);
    },
    defineProperty: reflectHelper.bind("defineProperty", [$diff, $freeze, $isDiffProxy, "$isDirty", "$reset"], false),
    deleteProperty: reflectHelper.bind("deleteProperty", [$diff, $freeze, $isDiffProxy, "$isDirty", "$reset"], false),
    getOwnPropertyDescriptor: reflectHelper.bind("getOwnPropertyDescriptor", [$diff, $freeze, $isDiffProxy, "$isDirty", "$reset"], void 0),
    has: reflectHelper.bind("has", [$diff, $freeze, $isDiffProxy, "$isDirty", "$reset"], true)
  });
}
function copy(target, base, recurse) {
  Object.entries(target).forEach(([k, v]) => {
    var _a;
    if (typeof v === "object" && v !== null) {
      if (v[$isDiffProxy]) {
        (_a = v[recurse]) == null ? void 0 : _a.call(v);
      } else {
        target[k] = createDiffProxy(v);
      }
    }
    base[k] = target[k];
  });
}
function createPKQuery(pkColumns = [], data = {}) {
  try {
    if (pkColumns.length === 0) throw new PrimaryKeyError();
    return pkColumns.reduce((query, col) => {
      if (data[col] === void 0 || data[col] === null) {
        throw new PrimaryKeyError(col);
      }
      query[col + ".eq"] = data[col];
      return query;
    }, {});
  } catch (e) {
    if (e instanceof PrimaryKeyError) {
      return e;
    } else {
      throw e;
    }
  }
}
function splitToObject(str, fieldDelimiter = ",", kvDelimiter = "=") {
  return str.split(fieldDelimiter).reduce((acc, field) => {
    const parts = field.split(kvDelimiter);
    acc[parts[0].trim()] = parts[1] ? parts[1].replace(/^["\s]+|["\s]+$/g, "") : void 0;
    return acc;
  }, {});
}
class FetchError extends Error {
  constructor(resp, body) {
    super(resp.statusText);
    this.name = "FetchError";
    this.resp = resp;
    this.status = resp.status;
    Object.assign(this, body);
  }
}
class AuthError extends FetchError {
  constructor(resp, body) {
    super(resp, body);
    this.name = "AuthError";
    Object.assign(this, splitToObject(resp.headers.get("WWW-Authenticate").replace(/^Bearer /, "")));
  }
}
class PrimaryKeyError extends Error {
  constructor(pk) {
    super(`Primary key not found ${pk ?? ""}`);
    this.name = "PrimaryKeyError";
  }
}
class SchemaNotFoundError extends Error {
  constructor(apiRoot, err) {
    super("No openapi definition found for api-root: " + apiRoot);
    this.name = SchemaNotFoundError;
    this.causedBy = err;
  }
}
async function throwWhenStatusNotOk(resp) {
  if (!resp.ok) {
    let body = {};
    try {
      body = await resp.json();
    } catch {
    }
    if (resp.headers.get("WWW-Authenticate")) {
      throw new AuthError(resp, body);
    }
    throw new FetchError(resp, body);
  }
  return resp;
}
class ObservableFunction extends Function {
  constructor(fn) {
    super();
    let boundFn = fn;
    const state = vue.reactive({
      hasReturned: false,
      pending: [],
      errors: [],
      get isPending() {
        return this.pending.length > 0;
      },
      get hasError() {
        return this.errors.length > 0;
      },
      clear(...args) {
        if (args.length) {
          this.errors = this.errors.filter((e, i) => !args.includes(e) && !args.includes(i));
        } else {
          this.errors = [];
          this.hasReturned = false;
        }
      },
      bind(thisArg, ...args) {
        boundFn = fn.bind(thisArg, ...args);
        return this;
      }
    });
    return new Proxy(fn, {
      apply: async (target, thisArg, argumentsList) => {
        const controller = new AbortController();
        state.pending.push(controller);
        try {
          const ret = await boundFn(controller.signal, ...argumentsList);
          state.clear();
          state.hasReturned = true;
          return ret;
        } catch (e) {
          state.errors.push(e);
          throw e;
        } finally {
          state.pending = state.pending.filter((p) => p !== controller);
        }
      },
      get: (target, propertyKey, receiver) => {
        if (propertyKey === "constructor") return Reflect.get(this, propertyKey, receiver);
        if (Reflect.ownKeys(state).includes(propertyKey)) {
          return Reflect.get(state, propertyKey, state);
        }
        return Reflect.get(target, propertyKey, target);
      },
      getOwnPropertyDescriptor: (target, propertyKey) => {
        if (Reflect.ownKeys(state).includes(propertyKey)) {
          return Reflect.getOwnPropertyDescriptor(state, propertyKey);
        }
        return Reflect.getOwnPropertyDescriptor(target, propertyKey);
      },
      has: (target, propertyKey) => {
        return Reflect.has(state, propertyKey) || Reflect.has(target, propertyKey);
      },
      ownKeys: (target) => {
        return Reflect.ownKeys(state).concat(Reflect.ownKeys(target));
      },
      set: (target, propertyKey, value, receiver) => {
        if (Reflect.ownKeys(state).includes(propertyKey)) {
          return Reflect.set(state, propertyKey, value, state);
        }
        return Reflect.set(target, propertyKey, value, target);
      }
    });
  }
}
class GenericModel {
  constructor(options, data) {
    __privateAdd(this, _GenericModel_instances);
    __privateAdd(this, _options);
    __privateAdd(this, _proxy);
    __publicField(this, "$get", new ObservableFunction(async (receiver, signal, opts = {}) => {
      const { keepChanges, ...options } = opts;
      return __privateMethod(this, _GenericModel_instances, request_fn).call(this, receiver, { method: "get", keepChanges }, signal, options);
    }));
    __publicField(this, "$post", new ObservableFunction(async (receiver, signal, opts = {}) => {
      const options = { return: "representation", ...opts };
      return __privateMethod(this, _GenericModel_instances, request_fn).call(this, receiver, { method: "post", needsQuery: false }, signal, options, __privateGet(this, _proxy));
    }));
    __publicField(this, "$put", new ObservableFunction(async (receiver, signal, opts) => {
      const options = { return: "representation", ...opts };
      return __privateMethod(this, _GenericModel_instances, request_fn).call(this, receiver, { method: "put" }, signal, options, __privateGet(this, _proxy));
    }));
    __publicField(this, "$patch", new ObservableFunction(async (receiver, signal, opts, data = {}) => {
      const options = { return: "representation", ...opts };
      if (!data || typeof data !== "object") {
        throw new Error("Patch data must be an object.");
      }
      const patchData = Object.assign(
        {},
        __privateGet(this, _proxy)[$diff],
        data
      );
      if (Object.keys(patchData).length === 0) {
        return __privateGet(this, _proxy);
      }
      return __privateMethod(this, _GenericModel_instances, request_fn).call(this, receiver, { method: "patch" }, signal, options, patchData);
    }));
    __publicField(this, "$delete", new ObservableFunction(async (receiver, signal, options = {}) => {
      return __privateMethod(this, _GenericModel_instances, request_fn).call(this, receiver, { method: "delete" }, signal, options);
    }));
    __privateSet(this, _options, options);
    __privateSet(this, _proxy, createDiffProxy(Object.assign({}, data)));
    return new Proxy(__privateGet(this, _proxy), {
      defineProperty: (target, propertyKey, attributes) => {
        if (Reflect.ownKeys(this).includes(propertyKey)) return false;
        return Reflect.defineProperty(target, propertyKey, attributes);
      },
      deleteProperty: (target, propertyKey) => {
        if (Reflect.ownKeys(this).includes(propertyKey)) return false;
        return Reflect.deleteProperty(target, propertyKey);
      },
      get: (target, propertyKey, receiver) => {
        if (propertyKey === "constructor" || Reflect.ownKeys(this).includes(propertyKey)) {
          const val = Reflect.get(this, propertyKey, this);
          if (["$get", "$post", "$put", "$patch", "$delete"].includes(propertyKey)) {
            return val.bind(this, receiver);
          }
          return val;
        }
        return Reflect.get(target, propertyKey, receiver);
      },
      has: (target, propertyKey) => {
        return Reflect.has(this, propertyKey) || Reflect.has(target, propertyKey);
      },
      set: (target, propertyKey, value, receiver) => {
        if (Reflect.ownKeys(this).includes(propertyKey)) return false;
        return Reflect.set(target, propertyKey, value, receiver);
      }
    });
  }
}
_options = new WeakMap();
_proxy = new WeakMap();
_GenericModel_instances = new WeakSet();
request_fn = async function(receiver, { method, keepChanges = false, needsQuery = true }, signal, opts, ...data) {
  await __privateGet(this, _options).route.$ready;
  const { columns, ...options } = opts;
  const query = { select: __privateGet(this, _options).select };
  if (needsQuery) {
    const q = __privateGet(this, _options).query;
    if (!q) throw new PrimaryKeyError();
    if (q instanceof PrimaryKeyError) throw q;
    Object.assign(query, q);
  }
  if (columns) {
    if (__privateGet(this, _options).route.columns) {
      query.columns = columns.filter((c) => __privateGet(this, _options).route.columns.includes(c));
    } else {
      query.columns = columns;
    }
  }
  data = data.map((data2) => {
    return Object.fromEntries(
      Object.entries(mapAliasesFromSelect(__privateGet(this, _options).select, data2)).filter(([col, v]) => !__privateGet(this, _options).route.columns || __privateGet(this, _options).route.columns.includes(col))
    );
  });
  const resp = await __privateGet(this, _options).route[method](query, { ...options, accept: "single", signal }, ...data);
  let body;
  try {
    body = await resp.json();
  } catch {
    if (!resp.headers.get("Location")) return;
    const loc = new URLSearchParams(resp.headers.get("Location").replace(/^\/[^?]+\?/, ""));
    return Object.fromEntries(Array.from(loc.entries()).map(([key, value]) => [key, value.replace(/^eq\./, "")]));
  }
  if (keepChanges) {
    const diff = __privateGet(this, _proxy)[$diff];
    Object.entries(body).forEach(([key, value]) => {
      receiver[key] = value;
    });
    __privateGet(this, _proxy)[$freeze]();
    Object.entries(diff).forEach(([key, value]) => {
      receiver[key] = value;
    });
  } else {
    Object.entries(body).forEach(([key, value]) => {
      receiver[key] = value;
    });
    __privateGet(this, _proxy)[$freeze]();
  }
  return body;
};
class GenericCollection extends Array {
  constructor(options, ...models) {
    super();
    __privateAdd(this, _options2);
    __privateAdd(this, _proxy2);
    __privateAdd(this, _range, {});
    __publicField(this, "$get", new ObservableFunction(async (receiver, signal, opts = {}) => {
      await __privateGet(this, _options2).route.$ready;
      const { accept, route, query = {}, ...options } = Object.assign({}, __privateGet(this, _options2), opts);
      const resp = await __privateGet(this, _options2).route.get(query, { ...options, signal });
      if (resp.headers.get("Content-Range")) {
        const [bounds, total] = resp.headers.get("Content-Range").split("/");
        const [first, last] = bounds.split("-");
        __privateSet(this, _range, {
          totalCount: total === "*" ? void 0 : parseInt(total, 10),
          first: parseInt(first, 10),
          last: isNaN(parseInt(last, 10)) ? void 0 : parseInt(last, 10)
        });
      }
      const body = await resp.json();
      receiver.length = 0;
      receiver.push(...body);
      return body;
    }));
    __privateSet(this, _options2, options);
    __privateSet(this, _proxy2, new Proxy(this, {
      defineProperty: (target, propertyKey, attributes) => {
        if (["$get", "$new"].includes(propertyKey)) return false;
        return Reflect.defineProperty(target, propertyKey, attributes);
      },
      deleteProperty: (target, propertyKey) => {
        if (["$get", "$new"].includes(propertyKey)) return false;
        return Reflect.deleteProperty(target, propertyKey);
      },
      get: (target, propertyKey, receiver) => {
        if (propertyKey === "$get") {
          return Reflect.get(target, propertyKey, receiver).bind(this, receiver);
        }
        if (propertyKey === "$range") return __privateGet(this, _range);
        return Reflect.get(target, propertyKey, receiver);
      },
      getOwnPropertyDescriptor: (target, propertyKey) => {
        if (["$get", "$new"].includes(propertyKey)) return void 0;
        return Reflect.getOwnPropertyDescriptor(target, propertyKey);
      },
      has: (target, propertyKey) => {
        return Reflect.has(this, propertyKey);
      },
      set: (target, propertyKey, value, receiver) => {
        var _a, _b;
        if (propertyKey === "length") return Reflect.set(target, propertyKey, value, receiver);
        if (typeof value !== "object" || !value) {
          throw new Error("Can only add objects to GenericCollection");
        }
        return Reflect.set(
          target,
          propertyKey,
          new GenericModel(
            {
              route: __privateGet(this, _options2).route,
              select: (_a = __privateGet(this, _options2).query) == null ? void 0 : _a.select,
              query: createPKQuery(__privateGet(this, _options2).route.pks, mapAliasesFromSelect((_b = __privateGet(this, _options2).query) == null ? void 0 : _b.select, value))
            },
            value
          ),
          receiver
        );
      }
    }));
    __privateGet(this, _proxy2).push(...models);
    return __privateGet(this, _proxy2);
  }
  map(...args) {
    return Array.from(this).map(...args);
  }
  $new(data) {
    const newIndex = this.push(data) - 1;
    return this[newIndex];
  }
}
_options2 = new WeakMap();
_proxy2 = new WeakMap();
_range = new WeakMap();
const mixin = {
  data() {
    return {
      pg: null
    };
  },
  watch: {
    pgConfig: {
      deep: true,
      immediate: true,
      async handler(cfg) {
        var _a;
        if (!cfg) return;
        const makeOptions = () => Object.defineProperties({}, {
          route: {
            get: () => this.$postgrest(this.pgConfig.apiRoot, this.pgConfig.token).$route(this.pgConfig.route),
            enumerable: true
          },
          query: {
            get: () => this.pgConfig.query,
            enumerable: true
          },
          limit: {
            get: () => this.pgConfig.limit,
            enumerable: true
          },
          offset: {
            get: () => this.pgConfig.offset,
            enumerable: true
          },
          count: {
            get: () => this.pgConfig.count,
            enumerable: true
          }
        });
        if (cfg.single && !(this.pg instanceof GenericModel)) {
          this.pg = new GenericModel(makeOptions(), {});
        } else if (!cfg.single && !(this.pg instanceof GenericCollection)) {
          this.pg = new GenericCollection(makeOptions());
        }
        if (this.pg instanceof GenericCollection || cfg.query) {
          try {
            await ((_a = this.pg) == null ? void 0 : _a.$get());
          } catch (e) {
            if (this.$options.onError) {
              this.$options.onError.forEach((hook) => hook.call(this, e));
            }
          }
        }
      }
    }
  }
};
const Postgrest = {
  name: "Postgrest",
  mixins: [mixin],
  props: {
    route: {
      type: String,
      required: true
    },
    apiRoot: {
      type: String
    },
    token: {
      type: String
    },
    query: {
      type: Object
    },
    single: {
      type: Boolean
    },
    limit: {
      type: Number
    },
    offset: {
      type: Number
    },
    count: {
      type: String
    }
  },
  emits: ["error"],
  computed: {
    pgConfig() {
      return {
        route: this.route,
        apiRoot: this.apiRoot,
        token: this.token,
        query: this.query,
        single: this.single,
        limit: this.limit,
        offset: this.offset,
        count: this.count
      };
    }
  },
  onError(err) {
    this.$emit("error", err);
  },
  render(h) {
    return this.$slots.default(this.pg);
  }
};
class Route extends Function {
  constructor(request2, ready) {
    super("", "return arguments.callee.request.apply(arguments.callee, arguments)");
    this.request = request2;
    this.options = request2.bind(null, "OPTIONS");
    this.get = request2.bind(null, "GET");
    this.head = request2.bind(null, "HEAD");
    this.post = request2.bind(null, "POST");
    this.put = request2.bind(null, "PUT");
    this.patch = request2.bind(null, "PATCH");
    this.delete = request2.bind(null, "DELETE");
    Object.defineProperty(this, "$ready", {
      value: ready
    });
  }
  _extractFromDefinition(tableDef) {
    this.columns = Object.keys(tableDef.properties);
    this.pks = Object.entries(tableDef.properties).filter(([field, fieldDef]) => {
      var _a;
      return (_a = fieldDef.description) == null ? void 0 : _a.includes("<pk/>");
    }).map(([field]) => field);
  }
}
class RPC extends Function {
  constructor(request2, ready) {
    super("", "return arguments.callee._call.apply(arguments.callee, arguments)");
    this._request = request2;
    Object.defineProperty(this, "$ready", {
      value: ready
    });
  }
  async _call(fn, signal, params, opts) {
    if (!(signal instanceof AbortSignal)) {
      opts = params;
      params = signal;
      signal = void 0;
    }
    const { get, query, ...requestOptions } = opts ?? {};
    if (get) {
      return this._request("rpc/" + fn, "GET", Object.assign({}, query, params), { ...requestOptions, signal });
    } else {
      return this._request("rpc/" + fn, "POST", query, { ...requestOptions, signal }, params);
    }
  }
}
function isLogicalOperator(k) {
  return ["and", "or", "not.and", "not.or"].includes(k);
}
function parseKey(key) {
  if (!key.includes(".")) return [key];
  const parts = key.split(".");
  const operator = parts.at(-1);
  const not = parts.at(-2) === "not";
  const field = parts.slice(0, not ? -2 : -1).join(".");
  if (not) return [field, "not", operator];
  return [field, operator];
}
function quoteValue(str) {
  str = str.toString();
  if ([",", ".", ":", "(", ")"].find((r) => str.includes(r)) || ["null", "true", "false"].includes(str)) {
    return `"${str}"`;
  } else {
    return str;
  }
}
function cc(prefix, str, suffix = "") {
  str = str == null ? void 0 : str.toString();
  return str ? `${prefix}${str}${suffix}` : "";
}
const _Query = class _Query extends URL {
  constructor(apiRoot, route, queryObject = {}) {
    const url = apiRoot.replace(/\/$/, "") + "/" + route.replace(/^\//, "");
    super(url, window.location.href);
    __publicField(this, "subQueries", {});
    __privateAdd(this, _apiRoot);
    __privateSet(this, _apiRoot, apiRoot);
    const { columns, select, order, limit, offset, on_conflict, ...conditions } = queryObject;
    if (on_conflict) this.searchParams.append("on_conflict", on_conflict);
    if (columns) this.searchParams.append("columns", columns);
    this._appendSelect(select);
    this._appendOrder(order);
    this._appendLimit(limit);
    this._appendOffset(offset);
    this._appendConditions(conditions);
    this._appendSubQueryParams(this);
  }
  _appendSubQueryParams(parent, aliasChain = "") {
    for (let [alias, query] of Object.entries(parent.subQueries)) {
      alias = cc(`${aliasChain}`, alias);
      for (const [key, value] of query.searchParams.entries()) {
        if (["columns", "select"].includes(key)) continue;
        this.searchParams.append(`${alias}.${key}`, value);
      }
      this._appendSubQueryParams(query, alias);
    }
  }
  _appendSelect(select) {
    if (typeof select === "object" && !Array.isArray(select)) {
      this.searchParams.append("select", this._parseSelectObject(select));
    } else if (select) {
      this.searchParams.append("select", select.toString());
    }
  }
  _parseSelectObject(obj, jsonChain = []) {
    return Object.entries(obj).map(([k, v]) => {
      if (!v) return false;
      if (v == null ? void 0 : v.select) {
        const alias2 = k.split(":", 1)[0].split("!", 1)[0];
        const subQuery = new _Query(__privateGet(this, _apiRoot), alias2, v);
        this.subQueries[alias2] = subQuery;
        return `${k}(${subQuery.searchParams.get("select")})`;
      }
      let alias = "";
      let field;
      let cast = "";
      let subfields = [];
      if (/^[^"]*:/.test(k)) {
        [alias, field] = k.split(/:(.+)/);
      } else if (/^".*[^\\]":/.test(k)) {
        [alias, field] = k.split(new RegExp('(?<=[^\\\\]"):(.+)'));
      } else {
        field = k;
      }
      if (typeof v === "string") {
        cast = v;
      } else if (typeof v === "object") {
        let fields;
        ({ "::": cast, ...fields } = v);
        subfields = this._parseSelectObject(fields, [...jsonChain, field]);
        if (subfields.length > 0 && !alias && !cast) {
          return subfields;
        }
      }
      return [
        cc("", alias, ":") + [...jsonChain, field].join("->") + cc("::", cast),
        subfields
      ];
    }).flat(2).filter(Boolean).join(",");
  }
  _appendOrder(order) {
    if (Array.isArray(order)) {
      this.searchParams.append("order", order.map((item) => {
        if (Array.isArray(item)) {
          return item.join(".");
        } else {
          return item;
        }
      }).join(","));
    } else if (typeof order === "object") {
      this.searchParams.append("order", Object.entries(order).map(([k, v]) => {
        if (v && typeof v === "string") {
          return `${k}.${v}`;
        } else {
          return k;
        }
      }).join(","));
    } else if (order) {
      this.searchParams.append("order", order);
    }
  }
  _appendLimit(limit) {
    if (limit) {
      this.searchParams.append("limit", limit);
    }
  }
  _appendOffset(offset) {
    if (offset) {
      this.searchParams.append("offset", offset);
    }
  }
  _appendConditions(obj) {
    for (const { key, value } of this._parseConditions(obj)) {
      this.searchParams.append(key, value);
    }
  }
  _parseConditions(obj, jsonPrefix = "", quoteStrings = false) {
    return Object.entries(obj).map(([key, value]) => {
      if (value === void 0) return false;
      const aliasKey = key.split(":");
      key = aliasKey[1] ?? aliasKey[0];
      if (isLogicalOperator(key)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("no object for logical operator");
        if (jsonPrefix) throw new Error("logical operators can't be nested with json operators");
        const strValue = this._parseConditions(value, "", true).map(({ key: k, value: v }) => {
          return isLogicalOperator(k) ? `${k}${v}` : `${k}.${v}`;
        }).join(",");
        if (!strValue) return void 0;
        return {
          key,
          value: `(${strValue})`
        };
      } else {
        const [field, ...ops] = parseKey(key);
        let strValue;
        switch (ops[ops.length - 1]) {
          case "in":
            strValue = this._valueToString(value, "()", true);
            break;
          case void 0:
            if (value && typeof value === "object" && !Array.isArray(value)) {
              return this._parseConditions(value, cc("", jsonPrefix, "->") + field);
            }
          // falls through
          default:
            strValue = this._valueToString(value, "{}", quoteStrings);
        }
        const jsonOperator = typeof value === "string" ? "->>" : "->";
        return {
          key: cc("", jsonPrefix, jsonOperator) + field,
          value: [...ops, strValue].join(".")
        };
      }
    }).flat().filter(Boolean);
  }
  _valueToString(value, arrayBrackets, quoteStrings) {
    if (value === null) {
      return "null";
    } else if (typeof value === "boolean") {
      return value.toString();
    } else if (Array.isArray(value)) {
      return arrayBrackets.charAt(0) + value.map((v) => this._valueToString(v, "{}", true)).join(",") + arrayBrackets.charAt(1);
    } else if (typeof value === "object") {
      const { lower, includeLower = true, upper, includeUpper = false } = value;
      return (includeLower ? "[" : "(") + lower + "," + upper + (includeUpper ? "]" : ")");
    } else {
      return quoteStrings ? quoteValue(value) : value;
    }
  }
};
_apiRoot = new WeakMap();
let Query = _Query;
let defaultHeaders;
function setDefaultHeaders(headers) {
  defaultHeaders = new Headers(headers);
}
const acceptHeaderMap = {
  "": "application/json",
  single: "application/vnd.pgrst.object+json",
  binary: "application/octet-stream",
  text: "text/plain"
};
async function request(apiRoot, token, route, method, query = {}, options = {}, body) {
  const headers = new Headers(defaultHeaders);
  const isJSONBody = ![
    Blob,
    FormData,
    URLSearchParams,
    // should implement ReadableStream here, but does not exist in node, so throws in tests
    ArrayBuffer,
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    DataView,
    String,
    void 0
  ].includes(body == null ? void 0 : body.constructor);
  if (isJSONBody) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", acceptHeaderMap[options.accept ?? ""] || options.accept);
  if (options.limit === 0) {
    headers.set("Range-Unit", "items");
    headers.set("Range", "-0");
  } else if (options.limit || options.offset !== void 0) {
    const lower = options.offset ?? 0;
    const upper = options.limit ? lower + options.limit - 1 : "";
    headers.set("Range-Unit", "items");
    headers.set("Range", [lower, upper].join("-"));
  }
  const prefer = ["return", "count", "params", "resolution"].filter((key) => options[key]).map((key) => `${key}=${options[key]}`).join(",");
  if (prefer) {
    headers.append("Prefer", prefer);
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      headers.set(k, v);
    }
  }
  const url = new Query(apiRoot, route, query);
  return await fetch(url.toString(), {
    method,
    headers,
    body: isJSONBody ? JSON.stringify(body) : body,
    signal: options.signal
  }).then(throwWhenStatusNotOk);
}
let schemaCache = {};
function resetSchemaCache() {
  schemaCache = {};
}
let defaultApiRoot = "/";
let defaultToken;
function setDefaultRoot(apiRoot = defaultApiRoot) {
  defaultApiRoot = apiRoot;
}
function setDefaultToken(token) {
  defaultToken = token;
}
const _Schema = class _Schema extends Function {
  constructor(apiRoot = defaultApiRoot, token = defaultToken) {
    super("", "return arguments.callee._call.apply(arguments.callee, arguments)");
    __privateAdd(this, _apiRoot2);
    __privateAdd(this, _token);
    const cached = schemaCache[apiRoot] && schemaCache[apiRoot][token];
    if (cached) return cached;
    __privateSet(this, _apiRoot2, apiRoot);
    __privateSet(this, _token, token);
    if (!schemaCache[apiRoot]) {
      schemaCache[apiRoot] = {};
    }
    schemaCache[apiRoot][token] = this;
    const ready = new Promise(async (resolve, reject) => {
      try {
        const schema = await this._fetchSchema(apiRoot, token);
        for (const path of Object.keys(schema.paths ?? {})) {
          if (path.startsWith("/rpc/")) {
            const fn = path.substring(5);
            this.rpc[fn] = new ObservableFunction(this.rpc.bind(this.rpc, fn));
          } else {
            const route = path.substring(1);
            this._createRoute(route);
          }
        }
        for (const [route, def] of Object.entries(schema.definitions ?? {})) {
          this._createRoute(route, def);
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    });
    Object.defineProperty(this, "$ready", {
      value: ready
    });
    this.rpc = new RPC(request.bind(null, __privateGet(this, _apiRoot2), __privateGet(this, _token)), this.$ready);
  }
  _call(apiRoot = __privateGet(this, _apiRoot2), token = __privateGet(this, _token)) {
    return new _Schema(apiRoot, token);
  }
  $route(route) {
    return this._createRoute(route);
  }
  _createRoute(route, def) {
    if (!this[route]) {
      this[route] = new Route(request.bind(null, __privateGet(this, _apiRoot2), __privateGet(this, _token), route), this.$ready);
    }
    if (def) {
      this[route]._extractFromDefinition(def);
    }
    return this[route];
  }
  async _fetchSchema(apiRoot, token) {
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    try {
      const url = new URL(apiRoot, window.location.href);
      const resp = await fetch(url.toString(), { headers }).then(throwWhenStatusNotOk);
      const body = await resp.json();
      if (!resp.headers.get("Content-Type").startsWith("application/openapi+json")) {
        throw new Error("wrong body format");
      }
      return body;
    } catch (err) {
      throw new SchemaNotFoundError(apiRoot, err);
    }
  }
};
_apiRoot2 = new WeakMap();
_token = new WeakMap();
let Schema = _Schema;
function usePostgrest(...args) {
  return new Schema(...args);
}
const Plugin = {
  install(app, options = {}) {
    app.config.optionMergeStrategies.onError = (to, from) => [...new Set([].concat(to ?? [], from))];
    app.component("postgrest", Postgrest);
    Object.defineProperty(app.config.globalProperties, "$postgrest", {
      get: usePostgrest
    });
    setDefaultRoot(options.apiRoot);
    setDefaultHeaders(options.headers);
  }
};
exports.AuthError = AuthError;
exports.FetchError = FetchError;
exports.PrimaryKeyError = PrimaryKeyError;
exports.SchemaNotFoundError = SchemaNotFoundError;
exports.default = Plugin;
exports.pg = mixin;
exports.resetSchemaCache = resetSchemaCache;
exports.setDefaultToken = setDefaultToken;
exports.usePostgrest = usePostgrest;
//# sourceMappingURL=vue-postgrest.js.map
