document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const dashboard = document.getElementById('dashboard');
    const logoutBtn = document.getElementById('logout-btn');

    const apiFetch = async (url, options = {}) => {
        const response = await fetch(url, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            ...options
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Request failed');
        }

        return response.json();
    };

    const showDashboard = () => {
        loginSection.classList.add('admin-hidden');
        dashboard.classList.remove('admin-hidden');
        logoutBtn.classList.remove('admin-hidden');
    };

    const showLogin = () => {
        loginSection.classList.remove('admin-hidden');
        dashboard.classList.add('admin-hidden');
        logoutBtn.classList.add('admin-hidden');
    };

    const setLoginMessage = (text, isError = false) => {
        loginMessage.textContent = text;
        loginMessage.classList.toggle('error', isError);
    };

    const resources = [
        {
            name: 'projects',
            formId: 'project-form',
            listId: 'project-list',
            fields: ['title', 'year', 'tags', 'link', 'description', 'is_published'],
            title: (item) => item.title,
            meta: (item) => [item.year, item.tags].filter(Boolean).join(' • ')
        },
        {
            name: 'certificates',
            formId: 'certificate-form',
            listId: 'certificate-list',
            fields: ['title', 'issuer', 'issue_date', 'link', 'description', 'is_published'],
            title: (item) => item.title,
            meta: (item) => [item.issuer, item.issue_date].filter(Boolean).join(' • ')
        },
        {
            name: 'testimonials',
            formId: 'testimonial-form',
            listId: 'testimonial-list',
            fields: ['name', 'role', 'company', 'link', 'quote', 'is_published'],
            title: (item) => item.name,
            meta: (item) => [item.role, item.company].filter(Boolean).join(' • ')
        },
        {
            name: 'posts',
            formId: 'post-form',
            listId: 'post-list',
            fields: ['title', 'published_at', 'link', 'excerpt', 'content', 'is_published'],
            title: (item) => item.title,
            meta: (item) => item.published_at || 'Draft'
        }
    ];

    const resourceState = {};

    const getFormPayload = (form, fields) => {
        const data = {};
        fields.forEach((field) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (!input) return;
            if (input.type === 'checkbox') {
                data[field] = input.checked ? 1 : 0;
            } else {
                data[field] = input.value.trim();
            }
        });
        return data;
    };

    const fillForm = (form, item, fields) => {
        const idInput = form.querySelector('[name="id"]');
        if (idInput) {
            idInput.value = item.id || '';
        }
        fields.forEach((field) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (!input) return;
            if (input.type === 'checkbox') {
                input.checked = Boolean(item[field]);
            } else {
                input.value = item[field] || '';
            }
        });
    };

    const resetForm = (formId) => {
        const form = document.getElementById(formId);
        if (!form) return;
        form.reset();
        const idInput = form.querySelector('[name="id"]');
        if (idInput) {
            idInput.value = '';
        }
    };

    const renderResourceList = (resource, items) => {
        const list = document.getElementById(resource.listId);
        if (!list) return;
        list.innerHTML = '';

        items.forEach((item) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'admin-item';

            const title = document.createElement('div');
            title.className = 'admin-item-title';
            title.textContent = resource.title(item) || 'Untitled';

            const meta = document.createElement('div');
            meta.className = 'content-meta';
            const status = item.is_published ? 'Published' : 'Draft';
            const metaText = [resource.meta(item), status].filter(Boolean).join(' • ');
            meta.textContent = metaText;

            const actions = document.createElement('div');
            actions.className = 'admin-item-actions';

            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.className = 'admin-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => {
                const form = document.getElementById(resource.formId);
                if (form) {
                    fillForm(form, item, resource.fields);
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'admin-btn secondary';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', async () => {
                if (!confirm('Delete this item?')) return;
                try {
                    await apiFetch(`/api/${resource.name}/${item.id}`, { method: 'DELETE' });
                    await loadResource(resource);
                } catch (error) {
                    alert(error.message);
                }
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            wrapper.appendChild(title);
            wrapper.appendChild(meta);
            wrapper.appendChild(actions);
            list.appendChild(wrapper);
        });
    };

    const loadResource = async (resource) => {
        const items = await apiFetch(`/api/${resource.name}?all=1`);
        resourceState[resource.name] = items;
        renderResourceList(resource, items);
    };

    const setupResource = (resource) => {
        const form = document.getElementById(resource.formId);
        if (!form) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const payload = getFormPayload(form, resource.fields);
            const id = form.querySelector('[name="id"]').value;
            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/${resource.name}/${id}` : `/api/${resource.name}`;

            try {
                await apiFetch(url, {
                    method,
                    body: JSON.stringify(payload)
                });
                resetForm(resource.formId);
                await loadResource(resource);
            } catch (error) {
                alert(error.message);
            }
        });
    };

    document.querySelectorAll('[data-reset]').forEach((button) => {
        button.addEventListener('click', () => resetForm(button.dataset.reset));
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        const payload = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            await apiFetch('/api/login', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            setLoginMessage('');
            showDashboard();
            await Promise.all(resources.map(loadResource));
        } catch (error) {
            setLoginMessage(error.message, true);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await apiFetch('/api/logout', { method: 'POST' });
        showLogin();
    });

    const init = async () => {
        resources.forEach(setupResource);
        try {
            await apiFetch('/api/me');
            showDashboard();
            await Promise.all(resources.map(loadResource));
        } catch (error) {
            showLogin();
        }
    };

    init();
});
