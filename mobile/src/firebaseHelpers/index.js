/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Turns firebase objects stored immediately under the given ref into state at
// [stateKey]: { [key]: {...value, id: key} }
// where key is keyFn(keyInData, valueInData) if keyFn is specified, otherwise
// the firebase key.
export function mapPushedDataToStateObjects(ref, component, stateKey, keyFn) {
  ref.on('child_added', onData)
  ref.on('child_changed', onData)
  ref.on('child_removed', onDataDeleted)

  function onData(data) {
    const valueInData = data.val()
    const key = keyFn ? keyFn(data.key, valueInData) : data.key
    component.setState(state => ({
      [stateKey]: {...state[stateKey], [key]: {...valueInData, id: key}}
    }))
  }

  function onDataDeleted(data) {
    component.setState(state => {
      const key = keyFn ? keyFn(data.key, data.val()) : data.key
      const { [key]: deletedValue, ...remaining } = state[stateKey]
      return { [stateKey]: remaining }
    })
  }
}

export function mapPushedDataToObjectOfStateObjects(ref, component, stateKey, keyFn, subKeyFn) {
  ref.on('child_added', onData)
  ref.on('child_changed', onData)
  ref.on('child_removed', onDataDeleted)

  function onData(data) {
    const valueInData = data.val()
    const key = keyFn(data.key, valueInData)
    const subKey = subKeyFn ? subKeyFn(data.key, valueInData) : data.key

    component.setState(state => {
      const stateAtKey = {...(state[stateKey][key] || {}), [subKey]: {...valueInData, id: subKey}}
      return {
        [stateKey]: {...state[stateKey], [key]: stateAtKey}
      }
    })
  }

  function onDataDeleted(data) {
    component.setState(state => {
      const valueInData = data.val()
      const key = keyFn(data.key, valueInData)
      const subKey = subKeyFn ? subKeyFn(data.key, valueInData) : data.key

      const stateAtKey = state[stateKey][key]
      if (!stateAtKey) return state

      const { [subKey]: deletedValue, ...remainingStateAtKey } = stateAtKey
      if (Object.keys(remainingStateAtKey).length === 0) {
        const {[key]: deletedParent , ...stateWithoutKey} = state[stateKey]
        return { [stateKey]: stateWithoutKey }
      }
      return { [stateKey]: {...state[stateKey], [key]: remainingStateAtKey} }
    })
  }
  
}

// Turns firebase objects {...value} with paths `/public/users/:userId/:userRefKey/:keyInUserData`
// into state at [stateKey]: { [key]: {...value, userId, id: key} }
// where key = keyFn(userId, keyInUserData, value)
export function mapPerUserPushedDataToStateObjects(fbc, userRefKey, component, stateKey, keyFn) {
  convertPerUserDataToState(fbc, userRefKey, component, stateKey, keyFn,
    (newState, userId, key) => delete newState[key],
    (newState, userId, key, value, keyInUserData) => newState[key] = {...value, userId, id: key})
}

// Turns firebase objects {...value} with paths `/public/users/:userId/:userRefKey/:keyInUserData`
// into state at [stateKey]: { [key]: {[subKey]: {...value, userId, key} } }
// where key =    keyFn(userId, keyInUserData, value)
// and   subKey = subKeyFn(userId, keyInUserData, value)
export function mapPerUserPushedDataToObjectOfStateObjects(fbc, userRefKey, component, stateKey, keyFn, subKeyFn) {
  convertPerUserDataToState(fbc, userRefKey, component, stateKey, keyFn,
    (newState, userId, key) => delete newState[key],
    (newState, userId, key, value, keyInUserData) => {
      const subKey = subKeyFn(userId, keyInUserData, value)
      const subValue = {...value, userId, id: subKey}
      newState[key] = {...(newState[key] || {}), [subKey]: subValue}
    })
}

// Turns firebase objects {...value} with paths `/public/users/:userId/:userRefKey/:keyInUserData`
// into state at [stateKey]: { [key]: count }
// where key =   keyFn(userId, keyInUserData, value)
// and   count = the number of objects from all users with [key]
export function reducePerUserDataToStateCount(fbc, userRefKey, component, stateKey,
    keyFn /* (userId, keyInUserData, valueInUserData) => key */) {
  convertPerUserDataToState(fbc, userRefKey, component, stateKey, keyFn,
    (newState, userId, key) => newState[key] = (newState[key] || 0) - 1,
    (newState, userId, key, value, keyInUserData) => newState[key] = (newState[key] || 0) + 1)
}

export function convertPerUserDataToState(fbc, userRefKey, component, stateKey, keyFn, stateDestroyer, stateCreator) {
  const ref = fbc.database.public.usersRef()
  const keysByUserId = {}

  ref.on('child_added', onUserData)
  ref.on('child_changed', onUserData)
  ref.on('child_removed', data => onUserData({ key: data.key, val: ()=>({}) }))

  function onUserData(data) {
    const userId = data.key
    const allUserData = (data.val() || {})
    const userData = allUserData[userRefKey] || {}
    component.setState(state => {
      const stateForKey = state[stateKey]
      const newStateForKey = {...stateForKey}

      // Remove old data for the user
      const oldKeysForUser = (keysByUserId[userId] || [])
      oldKeysForUser.forEach(key => {
        try {
          stateDestroyer(newStateForKey, userId, key)
        } catch (e) {
          console.error(e)
        }
      })

      // Add current data for the user
      const newKeysForUser = []
      Object.keys(userData).forEach(keyInUserData => {
        try {
          const value = userData[keyInUserData]
          const key = keyFn(userId, keyInUserData, value)
          newKeysForUser.push(key)
          stateCreator(newStateForKey, userId, key, value, keyInUserData)
        } catch (e) {
          console.error(e)
        }
      })

      keysByUserId[userId] = newKeysForUser
      
      return {[stateKey]: newStateForKey}
    })
  }
}
