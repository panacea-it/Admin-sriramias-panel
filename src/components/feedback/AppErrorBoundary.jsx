import { Component } from 'react'
import { Link } from 'react-router-dom'
import ErrorState from './ErrorState'
import Button from '../ui/Button'
import { isChunkLoadError } from '../../utils/chunkLoadError'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary]', error, info)
  }

  handleRetry = () => {
    const { error } = this.state
    if (isChunkLoadError(error)) {
      window.location.reload()
      return
    }
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const detail =
      import.meta.env.DEV && error?.message
        ? error.message
        : 'Something went wrong. Please try again or return to the dashboard.'

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7f7] px-4 py-12">
        <div className="w-full max-w-lg">
          <ErrorState
            title="The application encountered an error"
            message={detail}
            onRetry={this.handleRetry}
          />
          <div className="mt-6 flex justify-center">
            <Link to="/dashboard">
              <Button type="button">Back to dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
