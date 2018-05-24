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
import './Admin.css'

import {mapPushedDataToStateObjects, mapPushedDataToObjectOfStateObjects} from '@doubledutch/firebase-connector'
import Questions from './Questions'
import PresentationDriver from './PresentationDriver'
import {openTab} from './utils'

export default class Admin extends PureComponent {
  state = {
    sessions: {},
    questionsBySession: {},
    users: {},
    publicSessions: {}
  }

  sessionsRef = () => this.props.fbc.database.private.adminRef('sessions')
  questionsRef = () => this.props.fbc.database.private.adminRef('questions')
  backgroundUrlRef = () => this.props.fbc.database.public.adminRef('backgroundUrl')
  publicUsersRef = () => this.props.fbc.database.public.usersRef()
  publicSessionRef = () => this.props.fbc.database.public.adminRef('sessions')

  componentDidMount() {
    const {fbc} = this.props
    mapPushedDataToStateObjects(this.sessionsRef(), this, 'sessions')
    mapPushedDataToObjectOfStateObjects(this.questionsRef(), this, 'questionsBySession', (key, value) => value.sessionId)
    mapPushedDataToStateObjects(this.publicUsersRef(), this, 'users')
    mapPushedDataToStateObjects(this.publicSessionRef(), this, "publicSessions")
    this.backgroundUrlRef().on('value', data => this.setState({backgroundUrl: data.val()}))
    fbc.getLongLivedAdminToken().then(longLivedToken => this.setState({longLivedToken}))
  }

  componentDidUpdate() {
    if (!this.state.sessionId) {
      const sessionIds = Object.keys(this.state.sessions)
      if (sessionIds.length) this.setState({sessionId: sessionIds[0]})
    }
  }

  render() {
    const {backgroundUrl, launchDisabled, sessionId, sessions, users} = this.state
    console.log(this.state.publicSessions)
    return (
      <div className="Admin">
        <p className='bigBoxTitle'>Trivia Admin</p>
        <div className="row">
          <select value={sessionId} onChange={this.onSessionChange}>
            <option value="">-- Select a session --</option>
            { Object.values(sessions).map(s => <option key={s.id} value={s.id}>{s.name}</option>) }
          </select>
          <button onClick={this.createSession}>Create new session</button>
        </div>
        { sessionId && <div>
            <label className="row">
              <span>Session Name:&nbsp;</span>
              <input type="text" value={sessions[sessionId].name} onChange={this.onSessionNameChange} />
              <button className="secondary" onClick={this.deleteSession}>Delete Session</button>
            </label>
            <div className="session">
              <Questions
                questions={this.questionsForCurrentSession()}
                questionsRef={this.questionsRef()}
                renderFooter={() => (
                  <footer>
                    <div><label>Time per question: <input type="number" value={sessions[sessionId].secondsPerQuestion} onChange={this.onSecondsChange} /> seconds</label></div>
                    <div>
                      <button onClick={() => this.addQuestion(this.state.sessionId)}>Add New Question</button>
                    </div>
                  </footer>
                )}
              />
              <div className="presentation-container">
                <div className="presentation-side">
                  <iframe className="big-screen-container" src={this.bigScreenUrl()} title="presentation" />
                  <div className="presentation-overlays">
                    <div>Presentation Screen <button className="overlay-button" onClick={this.launchPresentation} disabled={launchDisabled || !this.bigScreenUrl()}>Launch in new tab</button></div>
                  </div>
                </div>
                <div className="presentation-side">
                  <PresentationDriver fbc={this.props.fbc} session={sessions[sessionId]} questions={this.questionsForCurrentSession()} users={users} />
                  <div className="presentation-overlays">
                    <div>Up Next</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        <div>
          <input type="text" value={backgroundUrl} onChange={this.onBackgroundUrlChange} placeholder="Custom background image URL. Suggested at least 700px high and wide." className="background-url" />
        </div>
      </div>
    )
  }

  questionsForCurrentSession = () => Object.values(this.state.questionsBySession[this.state.sessionId] || {}).sort((a,b) => a.order - b.order)

  onSessionChange = e => this.setState({sessionId: e.target.value})
  onSessionNameChange = e => this.sessionsRef().child(this.state.sessionId).update({name: e.target.value})
  onBackgroundUrlChange = e => this.backgroundUrlRef().set(e.target.value)
  onSecondsChange = e => this.sessionsRef().child(this.state.sessionId).update({secondsPerQuestion: +e.target.value})
  createSession = () => this.sessionsRef().push({name: 'New Session', secondsPerQuestion: 30}).then(ref => {
    this.setState({sessionId: ref.key})
    this.addQuestion(ref.key)
  })
  
  deleteSession = () => {
    const {sessionId, sessions} = this.state
    if (window.confirm(`Are you sure you want to delete session '${sessions[sessionId].name}'?`)) {
      this.setState({sessionId: ''})
      this.sessionsRef().child(sessionId).remove()
      this.publicSessionRef().child(sessionId).remove()
    }
  }

  addQuestion = (sessionId) => {
    this.questionsRef().push({sessionId, order: this.questionsForCurrentSession().length, text: '', options: ['','','',''], correctIndex: 0})
  }

  launchPresentation = () => {
    this.setState({launchDisabled: true})
    setTimeout(() => this.setState({launchDisabled: false}), 2000)
    openTab(this.bigScreenUrl())
  }

  bigScreenUrl = () => this.state.longLivedToken ? `?page=bigScreen&sessionId=${encodeURIComponent(this.state.sessionId)}&token=${encodeURIComponent(this.state.longLivedToken)}` : null
}
