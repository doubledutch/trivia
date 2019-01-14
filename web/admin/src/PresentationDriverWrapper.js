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
import { translate as t } from '@doubledutch/admin-client'
import {
  mapPushedDataToStateObjects,
  mapPushedDataToObjectOfStateObjects,
} from '@doubledutch/firebase-connector'
import BigScreen from './BigScreen'
import PresentationDriver from './PresentationDriver'

export default class PresentationDriverWrapper extends PureComponent {
  publicSessionRef = () =>
    this.props.fbc.database.public.adminRef('sessions').child(this.props.sessionId)

  publicUsersRef = () => this.props.fbc.database.public.usersRef()

  sessionsRef = () => this.props.fbc.database.private.adminRef('sessions')

  questionsRef = () => this.props.fbc.database.private.adminRef('questions')

  state = {
    questionsBySession: {},
    users: {},
    sessions: {},
    questions: {},
  }

  componentDidUpdate(prevProps) {
    if (prevProps.sessionId !== this.props.sessionId) {
      this.unwireHandlers()
      this.wireHandlers()

      const { publicSession } = this.state
      if (!this.timer && publicSession && publicSession.state === 'QUESTION_OPEN') this.startTimer()
    }
  }

  componentDidMount() {
    this.wireHandlers()
  }

  componentWillUnmount() {
    this.unwireHandlers()
  }

  unwireHandlers() {
    this.publicSessionRef().off('value', this.publicSessionHandler)
    this.clearTimer()
  }

  wireHandlers() {
    this.publicSessionHandler = this.publicSessionRef().on('value', data =>
      this.setState({ publicSession: data.val() }),
    )
    mapPushedDataToObjectOfStateObjects(
      this.questionsRef(),
      this,
      'questionsBySession',
      (key, value) => value.sessionId,
    )
    mapPushedDataToStateObjects(this.publicUsersRef(), this, 'users')
    mapPushedDataToStateObjects(this.sessionsRef(), this, 'sessions')
  }

  questionsForCurrentSession = () =>
    Object.values(this.state.questionsBySession[this.props.sessionId] || {}).sort(
      (a, b) => a.order - b.order,
    )

  render() {
    const { fbc, sessionId, sessionName } = this.props
    const { users } = this.state
    const questions = this.questionsForCurrentSession()
    const session = this.state.sessions[sessionId]
    return (
      <div>
        <div className="mobile-side">
          {questions && session && (
            <PresentationDriver fbc={fbc} session={session} questions={questions} users={users} />
          )}
        </div>
        <div className="help-text-box">
          <p className="help-text">{t('scroll')}</p>
        </div>
        {questions && session && <BigScreen fbc={fbc} sessionId={session.id} />}
      </div>
    )
  }
}
