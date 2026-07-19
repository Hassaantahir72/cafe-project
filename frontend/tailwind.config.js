/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cafe: { 50:'#fdf8f0',100:'#f9edda',200:'#f2d9b0',300:'#e8be7e',400:'#dba054',500:'#c4843a',600:'#a8692e',700:'#8a5128',800:'#6e3f24',900:'#5a3320' },
        warm: { 50:'#fafaf8',100:'#f5f4f0',200:'#eae8e0',300:'#d8d4c8',400:'#b8b2a0',500:'#938d7c',600:'#736d5e',700:'#5a5449',800:'#3e3a32',900:'#28251f' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':       'fadeIn .6s ease both',
        'fade-in-up':    'fadeInUp .7s ease both',
        'fade-in-down':  'fadeInDown .6s ease both',
        'fade-in-left':  'fadeInLeft .7s ease both',
        'fade-in-right': 'fadeInRight .7s ease both',
        'scale-in':      'scaleIn .5s ease both',
        'float':         'float 3s ease-in-out infinite',
        'float-slow':    'floatSlow 4s ease-in-out infinite',
        'marquee':       'marquee 20s linear infinite',
        'spin-slow':     'spinSlow 12s linear infinite',
        'bounce-in':     'bounceIn .7s cubic-bezier(.36,.07,.19,.97) both',
        'gradient':      'gradientShift 6s ease infinite',
        'shimmer':       'shimmer 1.5s infinite',
        'slide-up':      'slideUp .4s ease-out',
      },
      keyframes: {
        fadeIn:        { from:{opacity:0}, to:{opacity:1} },
        fadeInUp:      { from:{opacity:0,transform:'translateY(30px)'}, to:{opacity:1,transform:'translateY(0)'} },
        fadeInDown:    { from:{opacity:0,transform:'translateY(-20px)'}, to:{opacity:1,transform:'translateY(0)'} },
        fadeInLeft:    { from:{opacity:0,transform:'translateX(-30px)'}, to:{opacity:1,transform:'translateX(0)'} },
        fadeInRight:   { from:{opacity:0,transform:'translateX(30px)'}, to:{opacity:1,transform:'translateX(0)'} },
        scaleIn:       { from:{opacity:0,transform:'scale(0.92)'}, to:{opacity:1,transform:'scale(1)'} },
        float:         { '0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-12px)'} },
        floatSlow:     { '0%,100%':{transform:'translateY(0) rotate(0deg)'},'50%':{transform:'translateY(-8px) rotate(2deg)'} },
        marquee:       { from:{transform:'translateX(0)'}, to:{transform:'translateX(-50%)'} },
        spinSlow:      { from:{transform:'rotate(0deg)'}, to:{transform:'rotate(360deg)'} },
        bounceIn:      { '0%':{transform:'scale(0.3)',opacity:0},'50%':{transform:'scale(1.05)'},'70%':{transform:'scale(0.9)'},'100%':{transform:'scale(1)',opacity:1} },
        gradientShift: { '0%,100%':{backgroundPosition:'0% 50%'},'50%':{backgroundPosition:'100% 50%'} },
        shimmer:       { '0%':{backgroundPosition:'-200% 0'},'100%':{backgroundPosition:'200% 0'} },
        slideUp:       { from:{transform:'translateY(100%)'}, to:{transform:'translateY(0)'} },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(.16,1,.3,1)',
        'bounce': 'cubic-bezier(.36,.07,.19,.97)',
      },
      backgroundSize: { '200%': '200% 200%' },
    },
  },
  plugins: [],
};
