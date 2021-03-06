export class _Guard {
  constructor(swindon) {
    this._backendInit = []
    this._backendDeinit = []
    this._listeners = []
    this._cleanup = []
    this.close = this.close.bind(this);
    this._swindon = swindon
    this._connection = null
  }
  init(method_name, positional_args=[], keyword_args={}) {
    this._backendInit.push({ method_name, positional_args, keyword_args });
    if(this._swindon._status == 'active') {
      this._swindon._connection
        .call(method_name, positional_args, keyword_args)
    }
    return this;
  }
  deinit(method_name, positional_args=[], keyword_args={}) {
    this._backendDeinit.push({ method_name, positional_args, keyword_args });
    return this;
  }
  listen(topic, callback) {
    this._listeners.push({ topic, callback })
    if(this._swindon._connection) {
      this._cleanup.push(this._swindon._connection.subscribe(topic, callback))
    }
    return this;
  }
  close() {
    let conn = this._connection;
    let swindon = this._swindon;
    this._connection = null
    for(let cleanup of this._cleanup.splice(0, this._cleanup.length)) {
      cleanup()
    }
    if(conn) {
      for(let call of this._backendDeinit) {
        conn.call(call.method_name, call.positional_args, call.keyword_args)
      }
    }
    if(swindon) {
      swindon._removeGuard(this)
      this._swindon = null
    }
  }
  _subscribe() {
    this._cleanup = []
    for(let sub of this._listeners) {
      this._cleanup.push(this._swindon._connection
                         .subscribe(sub.topic, sub.callback))
    }
  }
  _callInits() {
    const conn = this._connection = this._swindon._connection
    for(let call of this._backendInit) {
      conn.call(call.method_name, call.positional_args, call.keyword_args)
    }
  }
}
