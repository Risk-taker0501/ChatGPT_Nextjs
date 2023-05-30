'use client'
import { useRef, useState } from 'react'
import useSWR from 'swr'

interface ModelType {
  object: 'engine'
  id: string
  ready: boolean
  owner: string
  permissions: null
  created: string
}

const Form = () => {
  const messageInput = useRef<HTMLTextAreaElement | null>(null)
  const [response, setResponse] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [models, setModels] = useState<ModelType[]>([])
  const [currentModel, setCurrentModel] = useState<string>('gpt-3.5-turbo')

  const handleEnter = (
    e: React.KeyboardEvent<HTMLTextAreaElement> &
      React.FormEvent<HTMLFormElement>
  ) => {
    if (e.key === 'Enter' && isLoading === false) {
      e.preventDefault()
      setIsLoading(true)
      handleSubmit(e)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const message = messageInput.current?.value
    if (message !== undefined) {
      setResponse((prev) => [...prev, message])
      messageInput.current!.value = ''
    }

    if (!message) {
      return
    }

    const response = await fetch('/api/response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        currentModel,
      }),
    })
    console.log('Edge function returned.')

    console.log(response)

    if (!response.ok) {
      throw new Error(response.statusText)
    }

    const data = response.body
    if (!data) {
      return
    }

    const reader = data.getReader()
    const decoder = new TextDecoder()
    let done = false

    setResponse((prev) => [...prev, message])

    let currentResponse: string[] = []
    while (!done) {
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      const chunkValue = decoder.decode(value)
      // currentResponse = [...currentResponse, message, chunkValue];
      currentResponse = [...currentResponse, chunkValue]
      setResponse((prev) => [...prev.slice(0, -1), currentResponse.join('')])
    }
    // breaks text indent on refresh due to streaming
    // localStorage.setItem('response', JSON.stringify(currentResponse));
    setIsLoading(false)
  }

  const handleReset = () => {
    localStorage.removeItem('response')
    setResponse([])
  }

  useSWR('fetchingResponse', async () => {
    const storedResponse = localStorage.getItem('response')
    if (storedResponse) {
      setResponse(JSON.parse(storedResponse))
    }
  })

  const fetcher = async () => {
    const models = await (await fetch('/api/models')).json()
    setModels(models.data)
    const modelIndex = models.data.findIndex(
      (model: ModelType) => model.id === 'gpt-3.5-turbo'
    )
    setCurrentModel(models.data[modelIndex].id)
    return models
  }

  useSWR('fetchingModels', fetcher)

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentModel(e.target.value)
  }

  return (
    <div className='flex justify-center'>
      <select
        value={currentModel}
        onChange={handleModelChange}
        className='w-72 fixed top-5 left-5 outline-none border-none p-4 rounded-md bg-white text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-900'
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.id}
          </option>
        ))}
      </select>

      <button
        onClick={handleReset}
        type='reset'
        className='fixed top-5 right-5 p-4 rounded-md bg-white text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-900 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent'
      >
        Clear History
      </button>
      <div className='w-full mx-2 flex flex-col items-start gap-3 pt-6 last:mb-6 md:mx-auto md:max-w-3xl'>
        {isLoading
          ? response.map((item: any, index: number) => {
              return (
                <div
                  key={index}
                  className={`${
                    index % 2 === 0 ? 'bg-blue-500' : 'bg-gray-500'
                  } p-3 rounded-lg`}
                >
                  <p>{item}</p>
                </div>
              )
            })
          : response
          ? response.map((item: string, index: number) => {
              return (
                <div
                  key={index}
                  className={`${
                    index % 2 === 0 ? 'bg-blue-500' : 'bg-gray-500'
                  } p-3 rounded-lg`}
                >
                  <p>{item}</p>
                </div>
              )
            })
          : null}
      </div>
      <form
        onSubmit={handleSubmit}
        className='fixed bottom-0 w-full md:max-w-3xl bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] mb-4'
      >
        <textarea
          name='Message'
          placeholder='Type your query'
          ref={messageInput}
          onKeyDown={handleEnter}
          className='w-full resize-none bg-transparent outline-none pt-4 pl-4 translate-y-1'
        />
        <button
          disabled={isLoading}
          type='submit'
          className='absolute top-[1.4rem] right-5 p-1 rounded-md text-gray-500 dark:hover:text-gray-400 dark:hover:bg-gray-900 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent'
        >
          <svg
            stroke='currentColor'
            fill='currentColor'
            strokeWidth='0'
            viewBox='0 0 20 20'
            className='h-4 w-4 rotate-90'
            height='1em'
            width='1em'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z'></path>
          </svg>
        </button>
      </form>
    </div>
  )
}

export default Form
