import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronRight,
  CreditCard,
  FileUp,
  Minus,
  Plus,
  Printer,
  QrCode,
  Receipt,
  RotateCcw,
} from 'lucide-react'
import './index.css'

type PrintColor = 'bn' | 'color'
type PrintSide = 'one' | 'two'
type JobState = 'empty' | 'ready' | 'paying' | 'printing' | 'done'

const pesos = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const steps = [
  { label: 'Subir', hint: 'PDF listo' },
  { label: 'Pagar', hint: 'Pago simple' },
  { label: 'Recoger', hint: 'Codigo final' },
]

function App() {
  const [fileName, setFileName] = useState('')
  const [copies, setCopies] = useState(1)
  const [color, setColor] = useState<PrintColor>('bn')
  const [side, setSide] = useState<PrintSide>('one')
  const [jobState, setJobState] = useState<JobState>('empty')
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
      timers.current = []
    },
    [],
  )

  const pages = fileName ? 8 : 0
  const pricePerPage = color === 'color' ? 8 : 2
  const duplexDiscount = side === 'two' ? 0.85 : 1
  const total = Math.ceil(pages * copies * pricePerPage * duplexDiscount)

  const currentStep = useMemo(() => {
    if (jobState === 'done' || jobState === 'printing') return 2
    if (fileName || jobState === 'paying') return 1
    return 0
  }, [fileName, jobState])

  const status = useMemo(() => {
    if (jobState === 'done') return 'Listo'
    if (jobState === 'printing') return 'Imprimiendo'
    if (jobState === 'paying') return 'Pagando'
    if (fileName) return 'Revisa'
    return 'Sube PDF'
  }, [fileName, jobState])

  const mainMessage = useMemo(() => {
    if (jobState === 'done') return 'Listo para recoger'
    if (jobState === 'printing') return 'Imprimiendo ahora'
    if (jobState === 'paying') return 'Pago aprobado'
    return fileName || 'PDF aqui'
  }, [fileName, jobState])

  function pickDemoFile() {
    setFileName('tarea-final.pdf')
    setJobState('ready')
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0]
    if (!nextFile) return
    setFileName(nextFile.name)
    setJobState('ready')
  }

  function pay() {
    if (!fileName) return
    clearSimulation()
    setJobState('paying')
    timers.current = [
      window.setTimeout(() => setJobState('printing'), 900),
      window.setTimeout(() => setJobState('done'), 3300),
    ]
  }

  function reset() {
    clearSimulation()
    setFileName('')
    setCopies(1)
    setColor('bn')
    setSide('one')
    setJobState('empty')
  }

  function clearSimulation() {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src="/uabc-escudo.png" alt="Escudo UABC" className="brand-mark" />
          <div>
            <p className="brand-title">Imprimir en UABC</p>
            <p className="brand-subtitle">Prototipo</p>
          </div>
        </div>
        <div className="status-pill">
          <Printer size={16} strokeWidth={2.3} />
          <span>{status}</span>
        </div>
      </header>

      <section className="workspace">
        <nav className="step-rail" aria-label="Pasos">
          {steps.map((step, index) => (
            <div
              className={`step-item ${currentStep === index ? 'active' : ''} ${currentStep > index ? 'done' : ''}`}
              key={step.label}
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
              <small>{step.hint}</small>
            </div>
          ))}
        </nav>

        <section className="work-panel" aria-label="Flujo de impresion">
          <div className="panel-head">
            <div>
              <p className="kicker">Autoservicio</p>
              <h1>Sube. Paga. Recoge.</h1>
            </div>
            <button className="icon-button" onClick={reset} type="button" aria-label="Reiniciar">
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="flow-grid">
            <section className={`upload-zone stage-${jobState}`}>
              {jobState === 'paying' ? (
                <CreditCard size={38} strokeWidth={1.8} />
              ) : jobState === 'printing' || jobState === 'done' ? (
                <Printer size={40} strokeWidth={1.8} />
              ) : (
                <FileUp size={34} strokeWidth={1.8} />
              )}
              <div>
                <h2>{mainMessage}</h2>
                <p>
                  {jobState === 'done'
                    ? 'Ve por tus hojas'
                    : jobState === 'printing'
                      ? 'Tus hojas estan saliendo'
                      : jobState === 'paying'
                        ? 'Tarjeta demo aceptada'
                        : fileName
                          ? `${pages} paginas detectadas`
                          : 'Solo archivo PDF'}
                </p>
              </div>
              {(jobState === 'printing' || jobState === 'paying') && (
                <div className="progress-track" aria-label={status}>
                  <span />
                </div>
              )}
              {jobState === 'done' && <div className="done-code">Codigo 42</div>}
              {(jobState === 'empty' || jobState === 'ready') && (
                <div className="upload-actions">
                  <label className="primary-action">
                    Elegir PDF
                    <input type="file" accept="application/pdf" onChange={onFileChange} />
                  </label>
                  <button className="secondary-action" type="button" onClick={pickDemoFile}>
                    Demo
                  </button>
                </div>
              )}
            </section>

            <section className="options">
              <div className={`payment-box ${jobState === 'paying' || jobState === 'printing' || jobState === 'done' ? 'paid' : ''}`}>
                <CreditCard size={18} />
                <div>
                  <strong>
                    {jobState === 'empty' ? 'Pago pendiente' : jobState === 'ready' ? 'Pago demo' : 'Pago aprobado'}
                  </strong>
                  <span>{jobState === 'ready' ? 'Toca Pagar' : jobState === 'empty' ? 'Sube PDF' : pesos.format(total)}</span>
                </div>
              </div>
              <div className="option-row">
                <span>Copias</span>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="Menos copias"
                    onClick={() => setCopies((value) => Math.max(1, value - 1))}
                  >
                    <Minus size={15} />
                  </button>
                  <strong>{copies}</strong>
                  <button
                    type="button"
                    aria-label="Mas copias"
                    onClick={() => setCopies((value) => Math.min(20, value + 1))}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              <div className="segmented" aria-label="Color">
                <button type="button" className={color === 'bn' ? 'selected' : ''} onClick={() => setColor('bn')}>
                  B/N
                </button>
                <button type="button" className={color === 'color' ? 'selected' : ''} onClick={() => setColor('color')}>
                  Color
                </button>
              </div>

              <div className="segmented" aria-label="Lados">
                <button type="button" className={side === 'one' ? 'selected' : ''} onClick={() => setSide('one')}>
                  1 lado
                </button>
                <button type="button" className={side === 'two' ? 'selected' : ''} onClick={() => setSide('two')}>
                  2 lados
                </button>
              </div>
            </section>
          </div>

          <footer className="bottom-strip">
            <div>
              <p className="tiny-label">Total</p>
              <strong>{pesos.format(total)}</strong>
            </div>
            <button
              className="pay-button"
              onClick={pay}
              type="button"
              disabled={!fileName || jobState === 'paying' || jobState === 'printing' || jobState === 'done'}
            >
              {jobState === 'done'
                ? 'Codigo 42'
                : jobState === 'printing'
                  ? 'Imprimiendo'
                  : jobState === 'paying'
                    ? 'Pagando'
                    : 'Pagar demo'}
              <ChevronRight size={18} />
            </button>
          </footer>
        </section>

        <aside className="receipt-panel" aria-label="Resumen">
          <div className="receipt-title">
            <Receipt size={18} />
            <span>Resumen</span>
          </div>

          <div className="rows">
            <Line label="Archivo" value={fileName || 'Sin PDF'} />
            <Line label="Paginas" value={String(pages)} />
            <Line label="Copias" value={String(copies)} />
            <Line label="Modo" value={color === 'color' ? 'Color' : 'B/N'} />
            <Line label="Total" value={pesos.format(total)} strong />
          </div>

          <div className={`pickup ${jobState === 'done' ? 'ready' : ''} ${jobState === 'printing' ? 'printing' : ''}`}>
            <div className="qr-box">
              {jobState === 'done' ? <Check size={46} /> : jobState === 'printing' ? <Printer size={46} /> : <QrCode size={46} />}
            </div>
            <p>{jobState === 'done' ? 'Codigo 42' : jobState === 'printing' ? 'Imprimiendo' : 'Pago primero'}</p>
          </div>

          <div className="machine">
            <Printer size={22} />
            <div>
              <strong>Impresora 03</strong>
              <span>Biblioteca central</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="line">
      <span>{label}</span>
      <strong className={strong ? 'money' : ''}>{value}</strong>
    </div>
  )
}

export default App
