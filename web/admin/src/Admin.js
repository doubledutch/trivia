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
import client, { translate as t } from '@doubledutch/admin-client'
import {
  mapPushedDataToStateObjects,
  mapPushedDataToObjectOfStateObjects,
} from '@doubledutch/firebase-connector'
import { CSVDownload } from '@doubledutch/react-csv'
import { AttendeeSelector } from '@doubledutch/react-components'
import Select from 'react-select'
import Questions from './Questions'
import PresentationDriver from './PresentationDriver'
import { openTab } from './utils'

export default class Admin extends PureComponent {
  state = {
    sessions: {},
    questionsBySession: {},
    users: {},
    publicSessions: {},
    currentIndex: 0,
    backgroundUrl: '',
    isFocus: false,
    isNew: false,
    admins: [],
    attendees: [],
    isExporting: false,
    isExportingResponses: false,
    exportList: [],
    responsesList: [],
    responseHeaders: null,
  }

  adminableUsersRef = () => this.props.fbc.database.private.adminableUsersRef()

  sessionsRef = () => this.props.fbc.database.private.adminRef('sessions')

  questionsRef = () => this.props.fbc.database.private.adminRef('questions')

  backgroundUrlRef = () => this.props.fbc.database.public.adminRef('backgroundUrl')

  publicUsersRef = () => this.props.fbc.database.public.usersRef()

  publicSessionRef = () => this.props.fbc.database.public.adminRef('sessions')

  componentDidMount() {
    const { fbc } = this.props

    this.adminableUsersRef().on('value', data => {
      const users = data.val() || {}
      const adminKeys = Object.keys(users).filter(id => users[id].adminToken)
      this.getAdmins(adminKeys)
    })

    mapPushedDataToStateObjects(this.sessionsRef(), this, 'sessions')
    mapPushedDataToObjectOfStateObjects(
      this.questionsRef(),
      this,
      'questionsBySession',
      (key, value) => value.sessionId,
    )
    mapPushedDataToStateObjects(this.publicUsersRef(), this, 'users')
    mapPushedDataToStateObjects(this.publicSessionRef(), this, 'publicSessions')
    this.backgroundUrlRef().on('value', data => this.setState({ backgroundUrl: data.val() || '' }))
    fbc.getLongLivedAdminToken().then(longLivedToken => this.setState({ longLivedToken }))
  }

  componentDidUpdate() {
    if (!this.state.sessionId) {
      const sessionIds = Object.keys(this.state.sessions)
      if (sessionIds.length) {
        this.setState({ sessionId: sessionIds[0] })
      }
    }
  }

  isSessionEnded = () => {
    const { publicSessions, sessionId } = this.state
    if (publicSessions[sessionId]) {
      const currentSession = publicSessions[sessionId]
      if (currentSession.state === 'ENDED') {
        return true
      }
    }
    return false
  }

  render() {
    const { backgroundUrl, launchDisabled, sessionId, sessions, users } = this.state
    const reformattedSessions = Object.values(sessions).map(s => {
      return { value: s.id, label: s.name }
    })
    const highlighted = reformattedSessions.find(item => item.value === sessionId)
    this.prepareExportHeaders()

    return (
      <div className="Admin">
        <p className="boxTitle">{t('challenge')}</p>
        <div className="row">
          <Select
            value={highlighted}
            onChange={this.onSessionChange}
            options={reformattedSessions}
            className="select"
          />
          <button className="dd-bordered secondary newSession" onClick={this.createSession}>
            {t('create')}
          </button>
        </div>
        {sessionId && (
          <div>
            <label className="row">
              <span>{t('name')} </span>
              <input
                className={`sessionName ${this.isDisplayable(sessionId) ? '' : 'bordered-error'}`}
                type="text"
                onFocus={this.saveFocus}
                onBlur={this.saveBlur}
                value={sessions[sessionId].name}
                maxLength={50}
                onChange={this.onSessionNameChange}
                ref="nameInput"
              />
              <button className="secondary" onClick={this.deleteSession}>
                {t('delete')}
              </button>
            </label>
            <p className="bigBoxTitle">{t('questions')}</p>
            <div className="session">
              <Questions
                questions={this.questionsForCurrentSession()}
                questionsRef={this.questionsRef()}
                currentIndex={this.state.currentIndex}
                sessionId={sessionId}
                publicSessions={this.state.publicSessions}
                renderFooter={() => (
                  <footer>
                    <div>
                      <label>
                        {t('timePer')}{' '}
                        <input
                          type="number"
                          min="0"
                          value={sessions[sessionId].secondsPerQuestion}
                          onChange={this.onSecondsChange}
                        />{' '}
                        {t('seconds')}
                      </label>
                    </div>
                    <div>
                      <label>
                        {t('leaderboardUp')}{' '}
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={sessions[sessionId].leaderboardMax || 1000}
                          onChange={this.onLeaderboardMaxChange}
                        />{' '}
                        {th(sessions[sessionId].leaderboardMax)} {t('place')}
                      </label>
                    </div>
                    <div>
                      {this.canAddNewQuestion() ? (
                        <button onClick={() => this.addQuestion(this.state.sessionId)}>
                          {t('addNew')}
                        </button>
                      ) : (
                        <button disabled>{t('completeLast')}</button>
                      )}
                    </div>
                  </footer>
                )}
              />
            </div>
            <div className="adminContainer">
              <p className="bigBoxTitle">{t('adminTitle')}</p>
              <p className="helpText">{t('adminHelp')}</p>
              <AttendeeSelector
                client={client}
                searchTitle={t('selectAdmin')}
                selectedTitle={t('currentAdmin')}
                onSelected={this.onAdminSelected}
                onDeselected={this.onAdminDeselected}
                selected={this.state.admins}
              />
            </div>
            <div className="presentation-container">
              <div className="presentation-side">
                <iframe
                  className="big-screen-container"
                  src={this.bigScreenUrl()}
                  title="presentation"
                />
                <div className="presentation-overlays">
                  <div>
                    {t('presentation')}{' '}
                    <button
                      className="overlay-button"
                      onClick={this.launchPresentation}
                      disabled={launchDisabled || !this.bigScreenUrl()}
                    >
                      {t('launch')}
                    </button>
                  </div>
                </div>
              </div>
              <div className="presentation-side">
                <PresentationDriver
                  fbc={this.props.fbc}
                  session={sessions[sessionId]}
                  saveCurrentIndex={this.saveCurrentIndex}
                  questions={this.questionsForCurrentSession()}
                  users={users}
                />
              </div>
            </div>
          </div>
        )}
        {this.state.sessionId && (
          <div className="csvLinkBox">
            <button className="csvButton" onClick={this.formatResponsesForExport}>
              {t('exportResponses')}
            </button>
            <button className="csvButton" onClick={this.formatDataForExport}>
              {t('export')}
            </button>
            {this.state.isExporting && this.state.exportList ? (
              <CSVDownload data={this.state.exportList} filename="results.csv" target="_blank" />
            ) : null}
            {this.state.isExportingResponses && this.state.responsesList ? (
              <CSVDownload
                data={this.state.responsesList}
                headers={this.state.responseHeaders}
                filename="responses.csv"
                target="_blank"
              />
            ) : null}
          </div>
        )}
        <div>
          <input
            type="text"
            value={backgroundUrl}
            onChange={this.onBackgroundUrlChange}
            placeholder={t('background')}
            className="background-url"
          />
        </div>
      </div>
    )
  }

  prepareExportHeaders = () => {
    const headers = [
      { label: 'First Name', key: 'firstName' },
      { label: 'Last Name', key: 'lastName' },
      { label: 'Email', key: 'email' },
    ]

    const questions = this.questionsForCurrentSession()
    questions.forEach(question => {
      headers.push({ label: question.text, key: question.order.toString() })
    })
    return headers
  }

  formatResponsesForExport = () => {
    const { sessionId, users } = this.state
    const headers = this.prepareExportHeaders()
    this.props.fbc.database.private.adminableUsersRef().once('value', data => {
      const answersPerUser = data.val() || {}
      const questions = this.questionsForCurrentSession()
      const answers = Object.keys(answersPerUser)
        .filter(
          id => answersPerUser[id].responses && answersPerUser[id].responses[sessionId] != null,
        )
        .filter(id => users[id])
        .map(id => {
          const formattedUserResponses = {}
          Object.entries(answersPerUser[id].responses[sessionId]).forEach(item => {
            const originalQuestion = questions.find(question => question.id === item[0])
            const title = originalQuestion ? originalQuestion.order.toString() : item[0]
            formattedUserResponses[title] = item[1]
          })
          return {
            firstName: users[id].firstName,
            lastName: users[id].lastName,
            email: users[id].email,
            ...formattedUserResponses,
          }
        })
      this.setState({
        isExportingResponses: true,
        responsesList: answers,
        responseHeaders: headers,
      })
      setTimeout(
        () =>
          this.setState({ isExportingResponses: false, responsesList: [], responseHeaders: null }),
        3000,
      )
    })
  }

  formatDataForExport = () => {
    const { sessionId, users } = this.state
    this.props.fbc.database.public
      .adminRef('sessions')
      .child(sessionId)
      .once('value', data => {
        const activeSession = data.val() || {}
        if (activeSession.scores) {
          const leaderboard = Object.keys(activeSession.scores)
            .filter(userId => users[userId])
            .sort(sortUsers) // Sort by descending score and break ties with ascending avg answer time
            .map((userId, i) => ({
              Place: i + 1,
              Score: activeSession.scores[userId].score,
              Average_Time: activeSession.scores[userId].time
                ? getSeconds(activeSession.scores[userId])
                : 0,
              First_Name: users[userId].firstName,
              Last_Name: users[userId].lastName,
              Email: users[userId].email,
            }))
          this.setState({ isExporting: true, exportList: leaderboard })
          setTimeout(() => this.setState({ isExporting: false, exportList: [] }), 3000)
        }
      })
  }

  getLeaderboard(scores) {
    if (!scores) return []
    const { users, session } = this.props
    let prevScore = Number.MAX_SAFE_INTEGER
    let place = 0
    const leaderboard = Object.keys(scores)
      .map(userId => ({ score: scores[userId], user: users[userId] }))
      .filter(x => x.user)
      .sort(sortUsers)
    leaderboard.forEach((playerScore, index) => {
      if (playerScore.score < prevScore) {
        place = index + 1
      }
      playerScore.place = place
      prevScore = playerScore.score
    })
    return session.leaderboardMax
      ? leaderboard.filter(p => p.place <= session.leaderboardMax)
      : leaderboard
  }

  getAdmins = keys => {
    const adminClickPromises = keys.map(result =>
      client
        .getAttendee(result)
        .then(user => {
          if (user.id) {
            return { ...user }
          }
        })
        .catch(err => null),
    )
    Promise.all(adminClickPromises).then(newResults => {
      this.setState({ admins: newResults.filter(x => x) })
    })
  }

  onAdminSelected = attendee => {
    const tokenRef = this.props.fbc.database.private
      .adminableUsersRef(attendee.id)
      .child('adminToken')
    this.setState()
    this.props.fbc.getLongLivedAdminToken().then(token => tokenRef.set(token))
    this.props.fbc.database.private
      .adminRef('adminUrl')
      .set(window.location.href + this.returnAdminScreenUrl())
  }

  onAdminDeselected = attendee => {
    const tokenRef = this.props.fbc.database.private
      .adminableUsersRef(attendee.id)
      .child('adminToken')
    tokenRef.remove()
  }

  isDisplayable = sessionId => {
    if (this.state.isFocus) return true
    if (this.state.isNew) return true

    const currentSession = this.state.sessions[sessionId]
    const dup = Object.values(this.state.sessions).find(
      i =>
        i.name.trim().toLowerCase() === currentSession.name.trim().toLowerCase() &&
        currentSession.id !== i.id,
    )
    const isDisplayable = currentSession.name.trim().length > 0 && !dup
    return isDisplayable
  }

  saveFocus = () => {
    this.setState({ isFocus: true })
  }

  saveBlur = () => {
    this.setState({ isFocus: false, isNew: false })
  }

  saveCurrentIndex = currentIndex => {
    this.setState({ currentIndex })
  }

  questionsForCurrentSession = () =>
    Object.values(this.state.questionsBySession[this.state.sessionId] || {}).sort(
      (a, b) => a.order - b.order,
    )

  onSessionChange = e => this.setState({ sessionId: e.value })

  onSessionNameChange = e => {
    const name = e.target.value
    const isPublicSession = this.state.publicSessions[this.state.sessionId]
    this.sessionsRef()
      .child(this.state.sessionId)
      .update({ name })
    if (isPublicSession)
      this.publicSessionRef()
        .child(this.state.sessionId)
        .update({ name })
  }

  onBackgroundUrlChange = e => this.backgroundUrlRef().set(e.target.value)

  onSecondsChange = e => {
    const seconds = e.target.value
    this.sessionsRef()
      .child(this.state.sessionId)
      .update({ secondsPerQuestion: +seconds })
  }

  onLeaderboardMaxChange = e => {
    const leaderboardMax = e.target.value
    this.sessionsRef()
      .child(this.state.sessionId)
      .update({ leaderboardMax: +leaderboardMax || 1000 })
  }

  createSession = () =>
    this.sessionsRef()
      .push({ name: '', secondsPerQuestion: 30 })
      .then(ref => {
        this.setState({ isNew: true })
        this.setState({ sessionId: ref.key })
        this.addQuestion(ref.key)
      })

  deleteSession = () => {
    const { sessionId, sessions } = this.state
    if (window.confirm(t('confirmDelete', { session: sessions[sessionId].name }))) {
      this.setState({ sessionId: '' })
      this.sessionsRef()
        .child(sessionId)
        .remove()
      this.publicSessionRef()
        .child(sessionId)
        .remove()
    }
  }

  addQuestion = sessionId => {
    const questions = this.questionsForCurrentSession()
    if (questions.length) {
      const checkQ = questions[questions.length - 1]
      if (checkQ.text && checkQ.options[0]) {
        this.questionsRef().push({
          sessionId,
          order: this.questionsForCurrentSession().length,
          text: '',
          options: ['', '', '', ''],
          correctIndex: 0,
        })
      } else return
    } else {
      this.questionsRef().push({
        sessionId,
        order: this.questionsForCurrentSession().length,
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
      })
    }
  }

  canAddNewQuestion = () => {
    const questions = this.questionsForCurrentSession()
    if (questions.length) {
      const checkQ = questions[questions.length - 1]
      if (checkQ.text && checkQ.options[0]) {
        return true
      }
      return false
    }
    return true
  }

  returnAdminScreenUrl = () =>
    this.state.longLivedToken
      ? `?page=adminScreen&token=${encodeURIComponent(this.state.longLivedToken)}`
      : null

  launchPresentation = () => {
    this.setState({ launchDisabled: true })
    setTimeout(() => this.setState({ launchDisabled: false }), 2000)
    openTab(this.bigScreenUrl())
  }

  bigScreenUrl = () =>
    this.state.longLivedToken
      ? `?page=bigScreen&sessionId=${encodeURIComponent(
          this.state.sessionId,
        )}&token=${encodeURIComponent(this.state.longLivedToken)}`
      : null
}

export function getSeconds(userInfo) {
  return Math.round(10 * (userInfo.time / userInfo.score / 1000)) / 10
}

function sortUsers(a, b) {
  if (a.score !== b.score) return b.score - a.score
  return a.time - b.time
}

const th = num => {
  if (!num || (num > 3 && num < 21)) return 'th'
  switch (num % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}
