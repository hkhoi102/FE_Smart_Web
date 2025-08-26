import Button from './Button'
import Card from './Card'
import Input from './Input'

const ComponentDemo = () => {
  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold text-gray-900">Component Library Demo</h2>
      
      {/* Button Demo */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button loading>Loading Button</Button>
          <Button disabled>Disabled Button</Button>
        </div>
      </section>

      {/* Card Demo */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cards</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Card variant="default">
            <h4 className="text-lg font-semibold mb-2">Default Card</h4>
            <p className="text-gray-600">This is a default card with standard styling.</p>
          </Card>
          
          <Card variant="elevated">
            <h4 className="text-lg font-semibold mb-2">Elevated Card</h4>
            <p className="text-gray-600">This card has enhanced shadow and elevation.</p>
          </Card>
          
          <Card variant="outlined">
            <h4 className="text-lg font-semibold mb-2">Outlined Card</h4>
            <p className="text-gray-600">This card has a prominent border outline.</p>
          </Card>
        </div>
      </section>

      {/* Input Demo */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Inputs</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <Input 
            label="Basic Input"
            placeholder="Enter your text here"
            helperText="This is a helper text below the input"
          />
          
          <Input 
            label="Input with Error"
            placeholder="This input has an error"
            error="This field is required"
          />
          
          <Input 
            label="Input with Left Icon"
            placeholder="Search..."
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          
          <Input 
            label="Input with Right Icon"
            placeholder="Enter password"
            type="password"
            rightIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Color Palette Demo */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Color Palette</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
            <div key={shade} className="text-center">
              <div 
                className={`w-16 h-16 rounded-lg mb-2 bg-primary-${shade}`}
                style={{ backgroundColor: `var(--color-primary-${shade})` }}
              ></div>
              <span className="text-xs text-gray-600">primary-{shade}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ComponentDemo
