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
import './base.css'
import client, { translate as t, useStrings } from '@doubledutch/admin-client'
import { provideFirebaseConnectorToReactComponent } from '@doubledutch/firebase-connector'
import Admin from './Admin'
import i18n from './i18n'
import BigScreen from './BigScreen'
import PresentationDriver from './PresentationDriver'
import { parseQueryString } from './utils'

useStrings(i18n)

const { token } = parseQueryString()
if (token) client.longLivedToken = token

class App extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    this.props.fbc.signinAdmin().then(() => this.setState({ isSignedIn: true }))
  }

  render() {
    const { fbc } = this.props
    if (!this.state.isSignedIn) return <div>Loading...</div>
    const qs = parseQueryString()

    switch (qs.page) {
      case 'bigScreen':
        return <BigScreen fbc={fbc} sessionId={qs.sessionId} />
      case 'adminScreen':
        return (
          <div>
            <div className="mobile-side">
              <PresentationDriver fbc={fbc} sessionId={qs.sessionId} sessionName={qs.sessionName} />
            </div>
          </div>
        )
      default:
        return <Admin fbc={fbc} />
    }
  }
}

export default provideFirebaseConnectorToReactComponent(
  client,
  'trivia',
  (props, fbc) => <App {...props} fbc={fbc} />,
  PureComponent,
)
