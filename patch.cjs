const fs = require('fs');
let code = fs.readFileSync('src/components/actions/AddEngineerView.tsx', 'utf8');

code = code.replace(
  /const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?\}, 1000\);\n  \};/,
  `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (role === 'Custom' && !customRole) return;
        
    setIsSubmitting(true);
    try {
      const finalRole = role === 'Custom' ? customRole : role;
      const name = email.split('@')[0].split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      
      const response = await fetch('/api/engineers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: \`eng-\${Date.now()}\`,
          name,
          email,
          role: finalRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create engineer');
      }

      setIsSuccess(true);
            
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setEmail('');
        setRole('Mechanical Engineer');
        setCustomRole('');
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };`
);
fs.writeFileSync('src/components/actions/AddEngineerView.tsx', code);
