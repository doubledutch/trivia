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

import React, { PureComponent } from 'react'
import './App.css'

import client from '@doubledutch/admin-client'
import FirebaseConnector from '@doubledutch/firebase-connector'
import {mapPushedDataToStateObjects, mapPushedDataToObjectOfStateObjects} from './firebaseHelpers'
import Questions from './Questions'
const fbc = FirebaseConnector(client, 'trivia')

fbc.initializeAppWithSimpleBackend()
const sessionsRef = () => fbc.database.private.adminRef('sessions')
const questionsRef = () => fbc.database.private.adminRef('questions')

export default class App extends PureComponent {
  state = {
    sessions: {},
    questionsBySession: {}
  }

  componentDidMount() {
    fbc.signinAdmin()
    .then(user => {
      mapPushedDataToStateObjects(fbc, sessionsRef(), this, 'sessions')
      mapPushedDataToObjectOfStateObjects(fbc, questionsRef(), this, 'questionsBySession', (key, value) => value.sessionId)
    })
  }

  render() {
    const {sessionId, sessions} = this.state
    return (
      <div className="App">
        <div className="row">
          <select value={sessionId} onChange={this.onSessionChange}>
            <option value="">-- Select a session --</option>
            { Object.values(sessions).map(s => <option key={s.id} value={s.id}>{s.name}</option>) }
          </select>
          <button onClick={this.createSession}>Create new session</button>
        </div>
        { sessionId && <div>
            <label className="row">
              <span>Session Name: </span>
              <input type="text" value={sessions[sessionId].name} onChange={this.onSessionNameChange} />
              <button className="secondary" onClick={this.deleteSession}>Delete Session</button>
            </label>
            <Questions
              questions={Object.values(this.questionsForCurrentSession())}
              questionsRef={questionsRef()}
              onAdd={this.addQuestion}
            />
          </div>
        }
      </div>
    )
  }

  questionsForCurrentSession = () => Object.values(this.state.questionsBySession[this.state.sessionId] || {})

  onSessionChange = e => this.setState({sessionId: e.target.value})
  onSessionNameChange = e => sessionsRef().child(this.state.sessionId).update({name: e.target.value})
  createSession = () => sessionsRef().push({name: 'New Session'}).then(ref => this.setState({sessionId: ref.key}))
  deleteSession = () => {
    const {sessionId, sessions} = this.state
    if (window.confirm(`Are you sure you want to delete session '${sessions[sessionId].name}'?`)) {
      this.setState({sessionId: ''})
      sessionsRef().child(sessionId).remove()
    }
  }

  addQuestion = () => {
    const {sessionId} = this.state
    questionsRef().push({sessionId, order: this.questionsForCurrentSession().length, text: '', options: []})
  }
}
