import { apiSlice } from "../../app/api/apiSlice";

/* Quiz administration API (backend/controllers/QuizController.js). The student-facing quiz endpoints are not used here. */
export const quizApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getQuizzes: builder.query({
            query: () => '/api/quizzes',
            providesTags: ['Quizzes'],
        }),
        getQuiz: builder.query({
            query: (id) => `/api/quizzes/${id}`,
            providesTags: (result, error, id) => [{ type: 'Quizzes', id }],
        }),
        saveQuiz: builder.mutation({
            // create when there is no id, otherwise update the details (questions are managed one by one)
            query: ({ id, ...body }) => id
                ? { url: '/api/quizzes', method: 'PUT', body: { id, ...body } }
                : { url: '/api/quizzes', method: 'POST', body },
            invalidatesTags: ['Quizzes'],
        }),
        deleteQuiz: builder.mutation({
            query: (id) => ({ url: '/api/quizzes', method: 'DELETE', body: { id } }),
            invalidatesTags: ['Quizzes'],
        }),
        addQuestion: builder.mutation({
            query: ({ quizId, ...body }) => ({ url: `/api/quizzes/${quizId}/questions`, method: 'POST', body }),
            invalidatesTags: ['Quizzes'],
        }),
        updateQuestion: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/api/quizzes/questions/${id}`, method: 'PUT', body }),
            invalidatesTags: ['Quizzes'],
        }),
        deleteQuestion: builder.mutation({
            query: (id) => ({ url: `/api/quizzes/questions/${id}`, method: 'DELETE' }),
            invalidatesTags: ['Quizzes'],
        }),
        importQuizzes: builder.mutation({
            query: (body) => ({ url: '/api/quizzes/import', method: 'POST', body }),
            invalidatesTags: ['Quizzes', 'QuizCategories'],
        }),
        getQuizCategories: builder.query({
            query: () => '/api/quizzes/categories',
            providesTags: ['QuizCategories'],
        }),
        addQuizCategory: builder.mutation({
            query: (body) => ({ url: '/api/quizzes/categories', method: 'POST', body }),
            invalidatesTags: ['QuizCategories'],
        }),
    }),
});

export const {
    useGetQuizzesQuery,
    useGetQuizQuery,
    useSaveQuizMutation,
    useDeleteQuizMutation,
    useAddQuestionMutation,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,
    useImportQuizzesMutation,
    useGetQuizCategoriesQuery,
    useAddQuizCategoryMutation,
} = quizApiSlice;
