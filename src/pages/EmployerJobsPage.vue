<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import debounce from 'lodash.debounce';
import EmployerJobs from '../components/EmployerJobs.vue'
import Pagination from '../components/Pagination.vue'
import JobSearch from '../components/JobSearch.vue'
import SalaryFilter from '../components/SalaryFilter.vue'
import ExperienceFilter from '../components/ExperienceFilter.vue'

const baseURL = import.meta.env.VITE_API_BASE_URL
const jobs = ref([])
const router = useRouter()
const route = useRoute()
const currentPage = ref(1)
const debouncedQuery = ref('');
const itemsPerPage = 2


const searchQuery = ref('')
const selectedSalaryRange = ref({ min: 10000, max: 200000 })
const selectedExperience = ref('All')


async function fetchJobs() {
    try {
        const res = await fetch(`${baseURL}/jobs`)
        const data = await res.json()
        if (Array.isArray(data)) {
            jobs.value = data || []
            currentPage.value = 1
        }
    } catch (err) {
        console.error("Failed to fetch jobs from API", err)
        jobs.value = []
    }
}

onMounted(fetchJobs)


function safeLower(str) {
    return typeof str === 'string' ? str.toLowerCase() : ''
}

const filteredJobs = computed(() => {
    return jobs.value.filter(job => {

        let salaryPass = false
        if (job.salary && typeof job.salary === 'object') {
            salaryPass =
                job.salary.min >= selectedSalaryRange.value.min &&
                job.salary.max <= selectedSalaryRange.value.max
        } else {
            const rawSalary = job.salary || '0'
            const numericSalary = parseInt(rawSalary.toString().replace(/[^\d]/g, ''))
            salaryPass =
                !isNaN(numericSalary) &&
                numericSalary >= selectedSalaryRange.value.min &&
                numericSalary <= selectedSalaryRange.value.max
        }


        const query = safeLower(searchQuery.value)
        const title = safeLower(job.jobTitle)
        const company = safeLower(job.company?.companyName)
        const location = safeLower(job.company?.location)
        const type = safeLower(job.jobType)
        const jobCategory = safeLower(job.jobCategory)
        const matchesSearch =
            title.includes(query) ||
            company.includes(query) ||
            location.includes(query) ||
            type.includes(query) ||
            jobCategory.includes(query)


        const expFilter = selectedExperience.value
        const matchesExperience = expFilter === 'All' || job.experience === expFilter

        return matchesSearch && salaryPass && matchesExperience
    })
})

const totalPages = computed(() => Math.ceil(filteredJobs.value.length / itemsPerPage))

const paginatedJobs = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredJobs.value.slice(startIndex, endIndex)
})


watch(selectedSalaryRange, (newRange) => {
    if (newRange.min === 10000 && newRange.max === 200000) {

        jobs.value = [...jobs.value];
    }
});

watch(() => route.query.category, (newCategory) => {
    selectedCategory.value = newCategory || ''
})

watch(searchQuery, debounce((val) => {
    debouncedQuery.value = val;
}, 300));

watch([searchQuery, selectedSalaryRange, selectedExperience], () => {
    currentPage.value = 1;
});


function handlePageChange(page) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleEdit(job) {
    router.push(`/employerjob/${job.id || job._id}`)
}

async function handleDelete(id) {
    const jobToDelete = jobs.value.find(job => job.id === id || job._id === id)
    if (!jobToDelete) return

    const confirmDelete = confirm(`Are you sure you want to delete the job "${jobToDelete.jobTitle}"?`)
    if (confirmDelete) {
        try {
            const response = await fetch(`${baseURL}/jobs/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                jobs.value = jobs.value.filter(job => job.id !== id && job._id !== id)
                if (currentPage.value > totalPages.value) {
                    currentPage.value = Math.max(1, totalPages.value)
                }
            }
        } catch (error) {
            console.error('Failed to delete job:', error)
        }
    }
}


function handleSalaryChange(range) {
    selectedSalaryRange.value = range
    currentPage.value = 1
}
function handleExperienceChange(exp) {
    selectedExperience.value = exp
    currentPage.value = 1
}
function handleSearchChange(val) {
    searchQuery.value = val
    currentPage.value = 1
}
</script>

<template>
    <div class="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-800">
        <!-- Sidebar Filters -->
        <aside
            class="w-full md:w-1/3 lg:w-1/4 p-4 md:p-6 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 class="font-bold mb-4 md:mb-6 text-center text-lg md:text-xl">All Filters</h2>
            <div class="space-y-4">
                <JobSearch v-model="searchQuery" @update:modelValue="handleSearchChange" />
                <SalaryFilter :salaryRange="selectedSalaryRange" @salary-changed="handleSalaryChange" />
                <ExperienceFilter @experience-changed="handleExperienceChange" />
            </div>
            <div class="mt-6">
                <Pagination v-if="filteredJobs.length > itemsPerPage" :current-page="currentPage"
                    :total-pages="totalPages" @page-changed="handlePageChange" />
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8">
            <div v-if="filteredJobs.length === 0" class="text-center text-gray-500 my-8 text-base md:text-lg">
                No jobs found
            </div>
            <template v-else>
                <EmployerJobs :jobs="paginatedJobs" @edit="handleEdit" @delete="handleDelete" />
            </template>
        </main>
    </div>
</template>