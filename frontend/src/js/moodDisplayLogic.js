import { ref, computed } from "vue";

export function useMoodDisplayLogic(props, emit) {
  const isLegendOpen = ref(false);
  const newCategoryName = ref("");

  // Mood Edit
  const editingMood = ref(null);
  const editForm = ref({ name: "", emoticon: "" });

  // Category Edit
  const editingCategory = ref(null);
  const editCategoryForm = ref({ name: "" });

  // Sorting/Mapping
  const dynamicCategorizedGroups = computed(() => {
    const structure = props.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      targets: cat.targets || [],
      moods: [],
    }));

    const misfitsBucket = {
      id: "cat-misc",
      name: "📦 Miscellaneous Vibes",
      moods: [],
    };

    props.activeLegendMoods.forEach((mood) => {
      if (!mood) return;
      if (mood.categoryId) {
        const explicitMatch = structure.find((c) => c.id === mood.categoryId);
        if (explicitMatch) {
          explicitMatch.moods.push(mood);
          return;
        }
      }

      const checkValue = (mood.name || mood.id || "").toLowerCase().trim();
      const matchedCluster = structure.find(
        (bucket) =>
          bucket.targets &&
          bucket.targets.some((keyword) => checkValue.includes(keyword)),
      );

      if (matchedCluster) {
        matchedCluster.moods.push(mood);
      } else {
        misfitsBucket.moods.push(mood);
      }
    });

    const renderList = [...structure];
    if (misfitsBucket.moods.length > 0 || props.categories.length === 0) {
      renderList.push(misfitsBucket);
    }
    return renderList;
  });

  // Cat Handlers
  const handleCreateCategory = () => {
    if (!newCategoryName.value.trim()) return;
    emit("add-category", newCategoryName.value.trim());
    newCategoryName.value = "";
  };

  const openEditCategoryModal = (group) => {
    editingCategory.value = group;
    editCategoryForm.value = { name: group.name };
  };

  const saveCategoryEdits = () => {
    if (editingCategory.value) {
      emit(
        "update-category",
        editingCategory.value.id,
        editCategoryForm.value.name,
      );
      editingCategory.value = null;
    }
  };

  const deleteExistingCategory = () => {
    if (
      editingCategory.value &&
      confirm(
        `Are you sure you want to delete "${editingCategory.value.name}"? Moods inside will return to Miscellaneous.`,
      )
    ) {
      emit("delete-category", editingCategory.value.id);
      editingCategory.value = null;
    }
  };
  // Mood Key Scroll Handler

  let scrollAnimationFrame = null;

  const handleDragOverScroll = (event) => {
    event.preventDefault();

    const container = document.querySelector(".mood-ring-column");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;

    const scrollThreshold = 80;
    const maxSpeed = 15;

    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }

    let speed = 0;

    if (relativeY < scrollThreshold) {
      speed = -maxSpeed * (1 - relativeY / scrollThreshold);
    } else if (rect.height - relativeY < scrollThreshold) {
      speed = maxSpeed * (1 - (rect.height - relativeY) / scrollThreshold);
    }

    if (speed !== 0) {
      const startScrolling = () => {
        container.scrollTop += speed;
        scrollAnimationFrame = requestAnimationFrame(startScrolling);
      };
      scrollAnimationFrame = requestAnimationFrame(startScrolling);
    }
  };

  const clearDragScrollLoop = () => {
    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }
  };
  // Drag & Drop Handlers
  const handleDragStart = (event, mood) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", mood.id);
  };

  const handleDrop = (event, targetCategoryId) => {
    const moodId = event.dataTransfer.getData("text/plain");
    if (moodId) {
      emit("move-mood", moodId, targetCategoryId);
    }
  };

  // Mood Modify
  const openEditModal = (mood) => {
    editingMood.value = mood;
    editForm.value = { name: mood.name, emoticon: mood.emoticon };
  };

  const saveMoodEdits = () => {
    if (editingMood.value) {
      emit(
        "update-mood",
        editingMood.value.id,
        editForm.value.name,
        editForm.value.emoticon,
      );
      editingMood.value = null;
    }
  };

  const deleteExistingMood = () => {
    if (
      editingMood.value &&
      confirm(`Are you sure you want to delete "${editingMood.value.name}"?`)
    ) {
      emit("delete-mood", editingMood.value.id);
      editingMood.value = null;
    }
  };

  return {
    isLegendOpen,
    newCategoryName,
    editingMood,
    editForm,
    editingCategory,
    editCategoryForm,
    dynamicCategorizedGroups,
    handleCreateCategory,
    handleDragStart,
    handleDrop,
    handleDragOverScroll,
    clearDragScrollLoop,
    openEditModal,
    saveMoodEdits,
    deleteExistingMood,
    openEditCategoryModal,
    saveCategoryEdits,
    deleteExistingCategory,
  };
}
