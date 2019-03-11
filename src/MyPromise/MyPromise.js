function MyPromise(executor) {
  const $this = this

  $this.status = 'pending'
  $this.value = undefined
  $this.resolvedCallbacks = []
  $this.rejectedCallbacks = []

  function resolve(value) {
    setTimeout(function() {
      if ($this.status === 'pending') {
        $this.status = 'resolved'
        $this.value = value

        $this.resolvedCallbacks.forEach(cb => cb(value))
      }
    })
  }

  function reject(reason) {
    setTimeout(function() {
      if ($this.status === 'pending') {
        $this.status = 'rejected'
        $this.value = reason

        $this.rejectedCallbacks.forEach(cb => cb(reason))
      }
    })
  }

  try {
    executor(resolve, reject)
  } catch(e) {
    reject(e)
  }
}

function resolvePromise(promise, x, resolve, reject) {
  let then, thenCalledOrThrow = false
  if (promise === x) {
    return reject(new TypeError('Chaining cycle detected for promise!'))
  }

  if ((x !== null) && ((typeof x === 'object') || (typeof x === 'function'))) {
    try {
      then = x.then
      if (typeof then === 'function') {
        then.call(x, function rsp(y) {
          if (thenCalledOrThrow) return
          thenCalledOrThrow = true
          resolvePromise(promise, y, resolve, reject)
        }, function rjp(r) {
          if (thenCalledOrThrow) return
          thenCalledOrThrow = true
          reject(r)
        })
      } else {
        resolve(x)
      }
    } catch(e) {
      if (thenCalledOrThrow) return
      reject(e)
    }
  } else {
    resolve(x)
  }
}

MyPromise.prototype.then = function(onResolved, onRejected) {
  const $this = this
  let promise2

  onResolved = typeof onResolved === 'function' ? onResolved : function(v) { return v }
  onRejected = typeof onRejected === 'function' ? onRejected : function(r) { throw r }

  if ($this.status === 'resolved') {
    return promise2 = new MyPromise(function(resolve, reject) {
      setTimeout(function() {
        try {
          resolve(onResolved($this.value))
        } catch(e) {
          reject(e)
        }
      })
    })
  }

  if ($this.status === 'rejected') {
    return promise2 = new MyPromise(function(resolve, reject) {
      setTimeout(function() {
        try {
          reject(onRejected($this.value))
        } catch(e) {
          reject(e)
        }
      })
    })
  }

  return promise2 = new MyPromise(function(resolve, reject) {
    $this.resolvedCallbacks.push(function(value) {
      try {
        const x = onResolved(value)
        resolvePromise(promise2, x, resolve, reject)
      } catch(e) {
        reject(e)
      }
    })
    $this.rejectedCallbacks.push(function(reason) {
      try {
        const x = onRejected(reason)
        resolvePromise(promise2, x, resolve, reject)
      } catch(e) {
        reject(e)
      }
    })
  })
}

MyPromise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected)
}

MyPromise.all = function(promises) {
  return new MyPromise(function(resolve, reject) {
    const promiseCount = promises.length
    const resolveValues = new Array(promiseCount)
    let resolvedCount = 0

    promises.forEach(function(promise, index) {
      MyPromise.resolve(promise).then(function(value) {
        resolvedCount++
        resolveValues[index] = value
        if (resolvedCount === promiseCount) {
          resolve(resolveValues)
        }
      }, function(reason) {
        reject(reason)
      })
    })
  })
}

MyPromise.race = function(promises) {
  return new MyPromise(function(resolve, reject) {
    promises.forEach(function(promise, index) {
      MyPromise.resolve(promise).then(function(value) {
        resolve(value)
      }, function(reason) {
        reject(reason)
      })
    })
  })
}

MyPromise.resolve = function(value) {
  const promise2 = new MyPromise(function(resolve, reject) {
    resolvePromise(promise2, value, resolve, reject)
  })
  return promise2
}

MyPromise.reject = function(reason) {
  return new MyPromise(function(resolve, reject) {
    reject(reason)
  })
}

MyPromise.deferred = function() {
  const deferred = {}

  deferred.promise = new MyPromise(function(resolve, reject) {
    deferred.resolve = resolve
    deferred.reject = reject
  })

  return deferred
}

try {
  module.exports = MyPromise
} catch(e) {}

