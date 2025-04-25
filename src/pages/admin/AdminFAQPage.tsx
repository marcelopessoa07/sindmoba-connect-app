
  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value === "no-category" ? '' : value,
    });
  };
